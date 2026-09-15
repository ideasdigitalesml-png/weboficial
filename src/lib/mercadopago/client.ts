// Thin wrappers over Mercado Pago's REST API. Server-only: reads
// MP_ACCESS_TOKEN, which must never reach the browser.

const MP_API_BASE = "https://api.mercadopago.com";

export interface CreatePreapprovalInput {
  reason: string;
  payerEmail: string;
  amount: number;
  currency: string;
  backUrl: string;
  externalReference: string;
}

export interface CreatePreapprovalResult {
  id: string;
  initPoint: string;
  status: string;
}

export interface PreapprovalDetails {
  id: string;
  status: string;
  externalReference: string | null;
}

export interface AuthorizedPaymentDetails {
  id: string;
  status: string;
  preapprovalId: string;
  transactionAmount: number;
  currencyId: string;
}

// Injectable interface: the real implementation below calls the live MP
// API; tests pass a fake so webhook-processing logic can be exercised
// without depending on (or faking) a real Mercado Pago transaction.
export interface MercadoPagoClient {
  createPreapproval(input: CreatePreapprovalInput): Promise<CreatePreapprovalResult>;
  getPreapproval(id: string): Promise<PreapprovalDetails>;
  getAuthorizedPayment(id: string): Promise<AuthorizedPaymentDetails>;
}

function accessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN is not set");
  return token;
}

async function mpFetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${MP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago API error (${res.status}) on ${path}: ${body}`);
  }
  return res.json();
}

export const mercadoPagoClient: MercadoPagoClient = {
  async createPreapproval(input) {
    const data = (await mpFetch("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: input.reason,
        payer_email: input.payerEmail,
        external_reference: input.externalReference,
        back_url: input.backUrl,
        status: "pending",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: input.amount,
          currency_id: input.currency,
        },
      }),
    })) as {
      id: string | number;
      init_point: string;
      sandbox_init_point?: string;
      status: string;
    };

    // TEMPORARY DEBUG: remove once the checkout redirect issue is resolved.
    console.log("[mercadopago] createPreapproval raw response:", JSON.stringify(data, null, 2));

    // A preapproval created with test credentials only exists in Mercado
    // Pago's sandbox database. `init_point` points at the production
    // checkout, which 404s ("esta página no existe") because it looks the
    // id up in the wrong database -- `sandbox_init_point` is the one that
    // actually resolves for test preapprovals.
    const initPoint = data.sandbox_init_point ?? data.init_point;

    return { id: String(data.id), initPoint, status: data.status };
  },

  async getPreapproval(id) {
    const data = (await mpFetch(`/preapproval/${id}`)) as {
      id: string | number;
      status: string;
      external_reference: string | null;
    };
    return {
      id: String(data.id),
      status: data.status,
      externalReference: data.external_reference ?? null,
    };
  },

  async getAuthorizedPayment(id) {
    const data = (await mpFetch(`/authorized_payments/${id}`)) as {
      id: string | number;
      status: string;
      preapproval_id: string | number;
      transaction_amount: number;
      currency_id: string;
    };
    return {
      id: String(data.id),
      status: data.status,
      preapprovalId: String(data.preapproval_id),
      transactionAmount: data.transaction_amount,
      currencyId: data.currency_id,
    };
  },
};
