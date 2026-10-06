// Not secret -- this ID is already public in every page's HTML (client
// Pixel snippet) and in the Conversions API request path below. The env
// var is optional; it exists so the ID can be changed without a code
// deploy, falling back to the ID already hardcoded in production today.
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "2925352314465309";
