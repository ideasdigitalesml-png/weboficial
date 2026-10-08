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
      eyebrow="PARA CONTADORES"
      profession="contadores"
      title="Tu página web profesional como contador, lista en minutos"
      previewImages={PREVIEW_IMAGES}
    />
  );
}
