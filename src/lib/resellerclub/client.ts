// Thin wrapper over ResellerClub's HTTP API (httpapi.com). Server-only:
// reads RESELLERCLUB_RESELLER_ID / RESELLERCLUB_API_KEY, which must never
// reach the browser.
//
// IMPORTANT -- read before relying on this in production: this was written
// from ResellerClub's publicly documented API shape, not verified against
// a live sandbox call (no test credentials were available while building
// this). Two specific things need to be confirmed against the real API
// before accepting real payments for either TLD:
//   1. TLD_PRODUCT_KEYS below only has a confident key for "com" (ResellerClub's
//      well-known "dotcom" product). ".com.ar" is deliberately left `null`
//      -- getResellerCost() throws a clear error for it rather than
//      guessing a product-key and risking a silently wrong charge. Look up
//      the real key via a manual reseller-price.json call and fill it in.
//   2. Argentina's ccTLD often has NIC.ar-specific registration/contact
//      requirements that plain gTLD contacts/add.json + domains/register.json
//      may not satisfy. Don't enable ".com.ar" purchases for real users
//      until a test registration actually succeeds in ResellerClub's panel.

const RC_API_BASE = "https://httpapi.com/api";

function credentials(): { resellerId: string; apiKey: string } {
  const resellerId = process.env.RESELLERCLUB_RESELLER_ID;
  const apiKey = process.env.RESELLERCLUB_API_KEY;
  if (!resellerId || !apiKey) {
    throw new Error("RESELLERCLUB_RESELLER_ID / RESELLERCLUB_API_KEY is not set");
  }
  return { resellerId, apiKey };
}

async function rcFetch(
  path: string,
  params: Record<string, string | string[]>,
  method: "GET" | "POST" = "GET"
): Promise<unknown> {
  const { resellerId, apiKey } = credentials();
  const query = new URLSearchParams();
  query.set("auth-userid", resellerId);
  query.set("api-key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) query.append(key, v);
    } else {
      query.set(key, value);
    }
  }

  const url = `${RC_API_BASE}${path}?${query.toString()}`;
  const res = await fetch(url, { method });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`ResellerClub API error (${res.status}) on ${path}: ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`ResellerClub API returned non-JSON on ${path}: ${body}`);
  }
}

export interface DomainAvailability {
  domain: string;
  tld: string;
  available: boolean;
}

export async function checkAvailability(
  baseName: string,
  tlds: string[]
): Promise<DomainAvailability[]> {
  const data = (await rcFetch("/domains/available.json", {
    "domain-name": baseName,
    tlds,
  })) as Record<string, { status?: string } | undefined>;

  return tlds.map((tld) => {
    const key = `${baseName}.${tld}`;
    const entry = data[key];
    return {
      domain: key,
      tld,
      available: entry?.status === "available",
    };
  });
}

// See the file-level comment: only "com" has a confirmed product-key.
const TLD_PRODUCT_KEYS: Record<string, string | null> = {
  com: "dotcom",
  "com.ar": null,
};

export async function getResellerCost(tld: string): Promise<number> {
  const productKey = TLD_PRODUCT_KEYS[tld];
  if (!productKey) {
    throw new Error(
      `No confirmed ResellerClub product-key for TLD "${tld}" -- verify against ` +
        `products/reseller-price.json in the reseller panel and fill in TLD_PRODUCT_KEYS.`
    );
  }

  const data = (await rcFetch("/products/reseller-price.json", {})) as Record<
    string,
    { addnewdomain?: Record<string, string> } | undefined
  >;

  const product = data[productKey];
  const yearOnePrice = product?.addnewdomain?.["1"];
  if (!yearOnePrice) {
    throw new Error(
      `ResellerClub reseller-price.json had no addnewdomain[1] price for product "${productKey}" (TLD "${tld}")`
    );
  }

  const cost = Number(yearOnePrice);
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new Error(`ResellerClub returned an invalid price for "${productKey}": ${yearOnePrice}`);
  }
  return cost;
}

export interface RegistrantContact {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  state: string;
  countryCode: string;
  zipcode: string;
  companyName: string | null;
}

// Creates a ResellerClub "customer" for this contact if one doesn't exist
// yet (persisted as registrant_contacts.resellerclub_customer_id so it's
// only ever created once per weboficial user). The password is generated
// and discarded -- this customer record is never logged into directly, it
// only exists so ResellerClub has an owner to attach the contact/domain to.
export async function ensureCustomer(
  contact: RegistrantContact,
  existingCustomerId: string | null
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const password = `Wo${crypto.randomUUID().replace(/-/g, "")}!1`;
  const data = (await rcFetch(
    "/customers/signup.json",
    {
      username: contact.email,
      passwd: password,
      name: contact.fullName,
      company: contact.companyName ?? contact.fullName,
      "address-line-1": contact.addressLine1,
      city: contact.city,
      state: contact.state,
      country: contact.countryCode,
      zipcode: contact.zipcode,
      "phone-cc": contact.phoneCountryCode,
      phone: contact.phoneNumber,
      "lang-pref": "en",
    },
    "POST"
  )) as string | number;

  return String(data);
}

export async function ensureContact(
  contact: RegistrantContact,
  customerId: string,
  existingContactId: string | null
): Promise<string> {
  if (existingContactId) return existingContactId;

  const data = (await rcFetch(
    "/contacts/add.json",
    {
      "customer-id": customerId,
      "attr-name": "type",
      name: contact.fullName,
      company: contact.companyName ?? contact.fullName,
      email: contact.email,
      "address-line-1": contact.addressLine1,
      city: contact.city,
      state: contact.state,
      country: contact.countryCode,
      zipcode: contact.zipcode,
      "phone-cc": contact.phoneCountryCode,
      phone: contact.phoneNumber,
      type: "Contact",
    },
    "POST"
  )) as string | number;

  return String(data);
}

export interface RegisterDomainResult {
  orderId: string;
  expiresAt: string;
}

export async function registerDomain(input: {
  domain: string;
  years: number;
  customerId: string;
  contactId: string;
  nameservers: string[];
}): Promise<RegisterDomainResult> {
  const data = (await rcFetch(
    "/domains/register.json",
    {
      "domain-name": input.domain,
      years: String(input.years),
      ns: input.nameservers,
      "customer-id": input.customerId,
      "reg-contact-id": input.contactId,
      "admin-contact-id": input.contactId,
      "tech-contact-id": input.contactId,
      "billing-contact-id": input.contactId,
      "invoice-option": "NoInvoice",
      "auto-renew": "false",
    },
    "POST"
  )) as { entityid?: string | number; actionstatus?: string; actionstatusdesc?: string };

  if (!data.entityid || data.actionstatus !== "Success") {
    throw new Error(
      `ResellerClub domain registration failed for ${input.domain}: ${data.actionstatusdesc ?? "unknown error"}`
    );
  }

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + input.years);

  return { orderId: String(data.entityid), expiresAt: expiresAt.toISOString() };
}
