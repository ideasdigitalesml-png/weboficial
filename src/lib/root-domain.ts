// Single source of truth for the platform's root domain. Read from the
// environment only -- never hardcode "weboficial.com.ar" (or any other
// literal domain) anywhere else in the codebase.
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";

if (!ROOT_DOMAIN) {
  throw new Error(
    "NEXT_PUBLIC_ROOT_DOMAIN is not set. Add it to .env.local (e.g. weboficial.com.ar)."
  );
}
