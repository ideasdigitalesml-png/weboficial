// Backs the floating WhatsApp support button shown on the public marketing
// pages (home, /contadores, /abogados, /psicologos, /terminos, /privacidad)
// -- never on /ejemplo, /onboarding, /dashboard, or a client's own landing.
// Reads the number from an env var instead of hardcoding it so it can be
// rotated from Vercel without a code change; when it's unset the button
// (and the pricing list's WhatsApp bullet) simply don't render.
const SUPPORT_MESSAGE = "Hola, tengo una consulta sobre weboficial";

export function getSupportWhatsappNumber(): string | undefined {
  return process.env.NEXT_PUBLIC_SOPORTE_WHATSAPP || undefined;
}

export function buildSupportWaLink(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
}
