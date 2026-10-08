import { DEFAULT_LANDING_VOCAB, type LandingVocab } from "@/lib/landing-vocab";

export interface FaqItem {
  q: string;
  a: string;
}

// Canonical copy: kept in exact sync with what the product actually does
// (see create-landing.ts/publish-draft.ts for the draft-then-active flow,
// 0005_subscriptions_payments_webhooks.sql for what happens on cancellation,
// /dashboard/dominio for custom domains, and subscriptions/plans for
// "$13.400", "sin permanencia", and the nombre.weboficial.com.ar subdomain
// shape) so this section never promises behavior the code doesn't have.
// `vocab` swaps "clientes"->"pacientes" for /psicologos (see
// landing-vocab.ts) -- every other word stays identical across all 4 pages.
// Kept outside FAQ.tsx (a "use client" component) so a server component
// like ProfessionLandingPage can call this directly to build `items`.
export function buildFaqItems(vocab: LandingVocab = DEFAULT_LANDING_VOCAB): FaqItem[] {
  return [
    {
      q: "¿Necesito saber programación?",
      a: "No. Completás un formulario simple y la página se arma sola.",
    },
    {
      q: "¿Cuánto tarda?",
      a: "Unos 10 minutos en armarla. Cuando activás la suscripción, queda online al instante.",
    },
    {
      q: "¿Tengo que pagar para probar?",
      a: "No. La armás y la ves gratis. Pagás solo para publicarla.",
    },
    {
      q: "¿Qué URL voy a tener?",
      a: "Tu página queda disponible en tuNombre.weboficial.com.ar.",
    },
    {
      q: "¿Puedo usar mi propio dominio?",
      a: "Sí. Buscás tu .com desde el panel, lo comprás y se conecta solo. Queda a tu nombre y se paga una vez por año.",
    },
    {
      q: "¿Cómo me contactan mis clientes?".replace("clientes", vocab.clientes),
      a: `Por WhatsApp, con un botón directo, y pidiendo ${vocab.turno} desde tu página.`,
    },
    {
      q: "¿Puedo modificar mis datos después?",
      a: "Sí, cuando quieras y sin límite.",
    },
    {
      q: "¿Puedo cancelar?",
      a: "Sí, cuando quieras, sin permanencia.",
    },
    {
      q: "¿Qué pasa si dejo de pagar?",
      a: "Tu página se desactiva. Si volvés a suscribirte, se reactiva sin cargos extra.",
    },
    {
      q: "¿Cómo pago?",
      a: "Con Mercado Pago.",
    },
  ];
}

export const DEFAULT_FAQ_ITEMS: FaqItem[] = buildFaqItems();
