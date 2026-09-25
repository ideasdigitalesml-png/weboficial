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

export interface CreateAuthorizedPreapprovalInput {
  cardTokenId: string;
  payerEmail: string;
  reason: string;
  externalReference: string;
  amount: number;
  currency: string;
  backUrl: string;
  // The preapproval_plan a card-tokenized subscription attaches to. MP's
  // docs for this flow still require reason/auto_recurring on the
  // preapproval itself even when a plan is set (they aren't inherited).
  preapprovalPlanId: string;
}

export interface CreateAuthorizedPreapprovalResult {
  id: string;
  status: string;
}

// One-time payment (Checkout Pro), used by the custom-domain purchase flow
// -- unlike every method above, this isn't a recurring subscription charge.
export interface CreatePreferenceInput {
  title: string;
  externalReference: string;
  amount: number;
  currency: string;
  backUrls: { success: string; failure: string; pending: string };
  notificationUrl: string;
}

export interface CreatePreferenceResult {
  id: string;
  initPoint: string;
}

export interface PaymentDetails {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  transactionAmount: number;
  currencyId: string;
}

export interface AuthorizedPaymentDetails {
  id: string;
  // The authorized_payment resource's own status is about scheduling, not
  // approval: scheduled | processed | recycling | cancelled. "processed"
  // means "no more retries", which covers both a successful charge AND a
  // charge that failed on its final retry -- it is NOT the same as
  // "approved". The actual approve/reject outcome lives in the nested
  // `payment` object below, which is only present once MP has actually
  // attempted the charge (absent while status is still "scheduled").
  status: string;
  paymentStatus: string | null;
  paymentStatusDetail: string | null;
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
  createAuthorizedPreapproval(
    input: CreateAuthorizedPreapprovalInput
  ): Promise<CreateAuthorizedPreapprovalResult>;
  getPreapproval(id: string): Promise<PreapprovalDetails>;
  getAuthorizedPayment(id: string): Promise<AuthorizedPaymentDetails>;
  createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult>;
  getPayment(id: string): Promise<PaymentDetails>;
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

  async createAuthorizedPreapproval(input) {
    const data = (await mpFetch("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        preapproval_plan_id: input.preapprovalPlanId,
        reason: input.reason,
        external_reference: input.externalReference,
        payer_email: input.payerEmail,
        card_token_id: input.cardTokenId,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: input.amount,
          currency_id: input.currency,
        },
        back_url: input.backUrl,
        status: "authorized",
      }),
    })) as { id: string | number; status: string };

    return { id: String(data.id), status: data.status };
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
      payment?: { status?: string; status_detail?: string } | null;
    };
    return {
      id: String(data.id),
      status: data.status,
      paymentStatus: data.payment?.status ?? null,
      paymentStatusDetail: data.payment?.status_detail ?? null,
      preapprovalId: String(data.preapproval_id),
      transactionAmount: data.transaction_amount,
      currencyId: data.currency_id,
    };
  },

  async createPreference(input) {
    const data = (await mpFetch("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            title: input.title,
            quantity: 1,
            unit_price: input.amount,
            currency_id: input.currency,
          },
        ],
        external_reference: input.externalReference,
        back_urls: {
          success: input.backUrls.success,
          failure: input.backUrls.failure,
          pending: input.backUrls.pending,
        },
        auto_return: "approved",
        notification_url: input.notificationUrl,
      }),
    })) as { id: string; init_point: string };

    return { id: data.id, initPoint: data.init_point };
  },

  async getPayment(id) {
    const data = (await mpFetch(`/v1/payments/${id}`)) as {
      id: string | number;
      status: string;
      status_detail?: string | null;
      external_reference: string | null;
      transaction_amount: number;
      currency_id: string;
    };
    return {
      id: String(data.id),
      status: data.status,
      statusDetail: data.status_detail ?? null,
      externalReference: data.external_reference ?? null,
      transactionAmount: data.transaction_amount,
      currencyId: data.currency_id,
    };
  },
};
