import type { Metadata } from "next";
import {
  ProfessionLandingPage,
  type ProfessionPreviewImage,
} from "@/components/ProfessionLandingPage";
import type { FaqItem } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Weboficial para psicólogos — Tu página profesional lista en minutos",
  description:
    "Creá tu página profesional como psicólogo en minutos. Mostrá tu enfoque, especialidades y forma de contacto de manera clara y profesional.",
  alternates: { canonical: "https://weboficial.com.ar/psicologos" },
  openGraph: {
    title: "Weboficial para psicólogos — Tu página profesional lista en minutos",
    description:
      "Creá tu página profesional como psicólogo en minutos. Mostrá tu enfoque, especialidades y forma de contacto de manera clara y profesional.",
    type: "website",
    url: "https://weboficial.com.ar/psicologos",
    images: ["/previews/psicologo-moderno.jpg"],
  },
};

const PREVIEW_IMAGES: ProfessionPreviewImage[] = [
  { src: "/previews/psicologo-moderno.jpg", label: "Moderno" },
  { src: "/previews/psicologo-clasico.jpg", label: "Clásico" },
  { src: "/previews/psicologo-minimal.jpg", label: "Minimal" },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "¿Necesito saber programación?",
    a: "No. El sistema te guía paso a paso. Solo completás tus datos y listo.",
  },
  {
    q: "¿Cuánto tarda en estar publicada mi página?",
    a: "Una vez que completás tus datos como psicólogo y realizás el pago, tu página queda disponible de inmediato.",
  },
  {
    q: "¿Qué URL voy a tener?",
    a: "Tu página queda disponible en tuNombre.weboficial.com.ar.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí, sin permanencia. Cancelás cuando quieras. No hay contratos ni cargos adicionales.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con Mercado Pago. Suscripción mensual de $13.400.",
  },
];

export default function PsicologosPage() {
  return (
    <ProfessionLandingPage
      professionPlural="psicólogos"
      title="Tu página web profesional como psicólogo, lista en minutos"
      previewImages={PREVIEW_IMAGES}
      faqItems={FAQ_ITEMS}
    />
  );
}
