import type { Metadata } from "next";
import {
  ProfessionLandingPage,
  type ProfessionPreviewImage,
} from "@/components/ProfessionLandingPage";

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

export default function ContadoresPage() {
  return (
    <ProfessionLandingPage
      professionPlural="contadores"
      eyebrow="Para contadores"
      profession="contadores"
      title="Tu página de contador en 10 minutos. Sin programadores."
      subtitle="Elegís un diseño, cargás tus datos y tus clientes te piden turno directo a tu WhatsApp. Todo por $13.400 por mes."
      previewImages={PREVIEW_IMAGES}
      exampleDomain="estudiocontablelopez.com"
      exampleHref="/ejemplo/contador"
    />
  );
}
