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
      eyebrow="PARA ABOGADOS"
      profession="abogados"
      title="Tu página web profesional como abogado, lista en minutos"
      previewImages={PREVIEW_IMAGES}
    />
  );
}
