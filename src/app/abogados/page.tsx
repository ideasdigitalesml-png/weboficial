import type { Metadata } from "next";
import {
  ProfessionLandingPage,
  type ProfessionPreviewImage,
} from "@/components/ProfessionLandingPage";

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

export default function AbogadosPage() {
  return (
    <ProfessionLandingPage
      professionPlural="abogados"
      eyebrow="Para abogados"
      profession="abogados"
      title="Tu página de abogado en 10 minutos. Sin programadores."
      subtitle="Elegís un diseño, cargás tus datos y tus clientes te piden turno directo a tu WhatsApp. Todo por $13.400 por mes."
      previewImages={PREVIEW_IMAGES}
      exampleDomain="dragarcia.com"
      exampleHref="/ejemplo/abogado"
    />
  );
}
