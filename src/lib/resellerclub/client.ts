// Thin wrapper over ResellerClub's HTTP API (httpapi.com). Server-only:
// reads RESELLERCLUB_RESELLER_ID / RESELLERCLUB_API_KEY, which must never
// reach the browser.
//
// Only ".com" is sold (see SUPPORTED_TLDS in @/lib/domains/pricing) -- no
// ".com.ar", so no NIC.ar-specific registration/contact requirements to
// worry about here.
//
// IMPORTANT: ResellerClub's product-key for ".com" is NOT the commonly
// assumed "dotcom" -- it's "domcno" (confirmed via the reseller panel URL
// /my-shop/domains/domcno; "dotcom" silently returned no addnewdomain
// pricing and made getResellerCost() fail). If ResellerClub ever renames
// this again, the TEMP log in getResellerCost() below prints every real
// product-key reseller-price.json returns, so the right one can be found
// without guessing.

import { getFixieDispatcher } from "./fixie-proxy";

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
  // `dispatcher` is a Node/undici-specific fetch extension, not part of the
  // DOM fetch typings -- this is the only ResellerClub call site, and it's
  // the only fetch in the codebase that must go through Fixie's static-IP
  // proxy (see fixie-proxy.ts for why).
  const res = await fetch(url, {
    method,
    dispatcher: getFixieDispatcher(),
  } as RequestInit & { dispatcher: ReturnType<typeof getFixieDispatcher> });
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

// See the file-level comment: ResellerClub's real product-key for ".com"
// is "domcno", not the commonly-assumed "dotcom".
const TLD_PRODUCT_KEYS: Record<string, string | null> = {
  com: "domcno",
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

  // TEMP (testing): logs just the product-key names reseller-price.json
  // actually returns, once per call -- this is how "domcno" was found to be
  // the real ".com" key instead of the assumed "dotcom". Safe to remove
  // once every TLD in TLD_PRODUCT_KEYS is confirmed working.
  console.log(`[resellerclub] reseller-price.json product keys: ${Object.keys(data).join(", ")}`);

  const product = data[productKey];
  const yearOnePrice = product?.addnewdomain?.["1"];

  // TEMP (testing): logs the raw, unconverted reseller-price.json value for
  // .com so it can be eyeballed in Vercel logs and confirmed to be a
  // USD-shaped cost (e.g. "9.00"), not an ARS-shaped customer price (e.g.
  // "18000") -- see the conversation this was added for. Safe to remove
  // once confirmed.
  console.log(
    `[resellerclub] reseller-price.json addnewdomain["1"] for productKey="${productKey}": raw=${JSON.stringify(yearOnePrice)}`
  );

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
