import type { Metadata } from "next";
import {
  ProfessionLandingPage,
  type ProfessionPreviewImage,
} from "@/components/ProfessionLandingPage";
import type { FaqItem } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Weboficial para abogados — Tu página profesional lista en minutos",
  description:
    "Creá tu página profesional como abogado en minutos. Sin programación, sin diseñador. Plantillas pensadas para el ejercicio de la abogacía.",
  alternates: { canonical: "https://weboficial.com.ar/abogados" },
  openGraph: {
    title: "Weboficial para abogados — Tu página profesional lista en minutos",
    description:
      "Creá tu página profesional como abogado en minutos. Sin programación, sin diseñador. Plantillas pensadas para el ejercicio de la abogacía.",
    type: "website",
    url: "https://weboficial.com.ar/abogados",
    images: ["/previews/abogado-moderno.jpg"],
  },
};

const PREVIEW_IMAGES: ProfessionPreviewImage[] = [
  { src: "/previews/abogado-moderno.jpg", label: "Moderno" },
  { src: "/previews/abogado-clasico.jpg", label: "Clásico" },
  { src: "/previews/abogado-minimal.jpg", label: "Minimal" },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "¿Necesito saber programación?",
    a: "No. El sistema te guía paso a paso. Solo completás tus datos y listo.",
  },
  {
    q: "¿Cuánto tarda en estar publicada mi página?",
    a: "Una vez que completás tus datos como abogado y realizás el pago, tu página queda disponible de inmediato.",
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

export default function AbogadosPage() {
  return (
    <ProfessionLandingPage
      professionPlural="abogados"
      title="Tu página web profesional como abogado, lista en minutos"
      previewImages={PREVIEW_IMAGES}
      faqItems={FAQ_ITEMS}
    />
  );
}
