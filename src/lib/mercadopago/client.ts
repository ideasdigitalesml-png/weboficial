// Thin wrappers over Mercado Pago's REST API. Server-only: reads
// MP_ACCESS_TOKEN, which must never reach the browser.

const MP_API_BASE = "https://api.mercadopago.com";

export interface CreatePreapprovalPlanInput {
  reason: string;
  externalReference: string;
  amount: number;
  currency: string;
  backUrl: string;
}

export interface CreatePreapprovalPlanResult {
  id: string;
  initPoint: string;
}

export interface PreapprovalDetails {
  id: string;
  status: string;
  externalReference: string | null;
  preapprovalPlanId: string | null;
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
//
// We use plan-based subscriptions (preapproval_plan) rather than creating
// a preapproval per customer directly: MP's /preapproval endpoint always
// requires a fixed payer_email and locks the checkout to that exact MP
// account, which rejects any customer whose MP account uses a different
// email than the one they signed up with. A plan's init_point is generic:
// the customer picks their own MP account (or card, no account needed) at
// checkout, and MP creates the preapproval on their behalf.
export interface MercadoPagoClient {
  createPreapprovalPlan(input: CreatePreapprovalPlanInput): Promise<CreatePreapprovalPlanResult>;
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
  async createPreapprovalPlan(input) {
    const data = (await mpFetch("/preapproval_plan", {
      method: "POST",
      body: JSON.stringify({
        reason: input.reason,
        external_reference: input.externalReference,
        back_url: input.backUrl,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: input.amount,
          currency_id: input.currency,
        },
      }),
    })) as { id: string; init_point: string };

    return { id: data.id, initPoint: data.init_point };
  },

  async getPreapproval(id) {
    const data = (await mpFetch(`/preapproval/${id}`)) as {
      id: string | number;
      status: string;
      external_reference: string | null;
      preapproval_plan_id?: string | null;
    };
    return {
      id: String(data.id),
      status: data.status,
      externalReference: data.external_reference ?? null,
      preapprovalPlanId: data.preapproval_plan_id ?? null,
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
