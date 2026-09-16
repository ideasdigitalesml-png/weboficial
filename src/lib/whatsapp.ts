// Countries the wizard offers in the WhatsApp field's country-code selector.
// Argentina is first and is the default -- most contadores using the
// platform today are AR-based, and their locally-copied numbers are the
// ones that need the leading 0/15 cleanup below.
export const WHATSAPP_COUNTRY_CODES = [
  { code: "+54", label: "Argentina (+54)" },
  { code: "+598", label: "Uruguay (+598)" },
  { code: "+56", label: "Chile (+56)" },
  { code: "+52", label: "México (+52)" },
  { code: "+34", label: "España (+34)" },
  { code: "+1", label: "Estados Unidos (+1)" },
] as const;

export const DEFAULT_WHATSAPP_COUNTRY_CODE = "+54";

// E.164-ish: a leading "+" followed by 8-15 digits, first digit non-zero.
export const WHATSAPP_VALUE_RE = /^\+[1-9]\d{7,14}$/;

// Cleans up the number part a user pastes in: strips everything but digits,
// then -- for Argentina only -- drops a leading trunk "0" and a leading
// mobile prefix "15", both extremely common artifacts of copying a number
// the way people actually write it locally (e.g. "011 15-2233-4455").
export function normalizePhoneDigits(raw: string, countryCode: string): string {
  let digits = raw.replace(/\D/g, "");
  if (countryCode === "+54") {
    digits = digits.replace(/^0/, "");
    digits = digits.replace(/^15/, "");
  }
  return digits;
}

// Combines a country code and a raw (possibly messy) number into the single
// normalized string stored in form_data, e.g. ("+54", "011 15-2233-4455")
// -> "+541122334455". Returns null if the result isn't a plausible number,
// so the caller can show a validation error instead of saving garbage.
export function buildWhatsappValue(
  countryCode: string,
  rawNumber: string
): string | null {
  const value = `${countryCode}${normalizePhoneDigits(rawNumber, countryCode)}`;
  return WHATSAPP_VALUE_RE.test(value) ? value : null;
}

// Reverse of buildWhatsappValue, for pre-filling the country selector +
// number input when editing an already-saved whatsapp value.
export function splitWhatsappValue(value: string): {
  countryCode: string;
  number: string;
} {
  const match = WHATSAPP_COUNTRY_CODES.find((c) => value.startsWith(c.code));
  if (!match) {
    return { countryCode: DEFAULT_WHATSAPP_COUNTRY_CODE, number: "" };
  }
  return { countryCode: match.code, number: value.slice(match.code.length) };
}

// The stored value is already digits-only after the "+", so wa.me just
// needs the "+" stripped.
export function buildWaLink(whatsappValue: string): string {
  return `https://wa.me/${whatsappValue.replace(/\D/g, "")}`;
}
