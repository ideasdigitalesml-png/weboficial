import type { Metadata } from "next";
import {
  ProfessionLandingPage,
  type ProfessionPreviewImage,
} from "@/components/ProfessionLandingPage";
import type { FaqItem } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Weboficial para contadores — Tu página profesional lista en minutos",
  description:
    "Creá tu página profesional como contador en minutos. Sin programación, sin diseñador. Elegí tu plantilla, completá tus datos y publicá.",
  alternates: { canonical: "https://weboficial.com.ar/contadores" },
  openGraph: {
    title: "Weboficial para contadores — Tu página profesional lista en minutos",
    description:
      "Creá tu página profesional como contador en minutos. Sin programación, sin diseñador. Elegí tu plantilla, completá tus datos y publicá.",
    type: "website",
    url: "https://weboficial.com.ar/contadores",
    images: ["/previews/contador-moderno.jpg"],
  },
};

const PREVIEW_IMAGES: ProfessionPreviewImage[] = [
  { src: "/previews/contador-moderno.jpg", label: "Moderno" },
  { src: "/previews/contador-clasico.jpg", label: "Clásico" },
  { src: "/previews/contador-minimal.jpg", label: "Minimal" },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "¿Necesito saber programación?",
    a: "No. El sistema te guía paso a paso. Solo completás tus datos y listo.",
  },
  {
    q: "¿Cuánto tarda en estar publicada mi página?",
    a: "Una vez que completás tus datos como contador y realizás el pago, tu página queda disponible de inmediato.",
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

export default function ContadoresPage() {
  return (
    <ProfessionLandingPage
      professionPlural="contadores"
      title="Tu página web profesional como contador, lista en minutos"
      previewImages={PREVIEW_IMAGES}
      faqItems={FAQ_ITEMS}
    />
  );
}
