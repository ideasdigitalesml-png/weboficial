import type { Metadata } from "next";
import {
  ProfessionLandingPage,
  type ProfessionPreviewImage,
} from "@/components/ProfessionLandingPage";

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

export default function PsicologosPage() {
  return (
    <ProfessionLandingPage
      professionPlural="psicólogos"
      eyebrow="PARA PSICÓLOGOS"
      profession="psicologos"
      title="Tu página web profesional como psicólogo, lista en minutos"
      previewImages={PREVIEW_IMAGES}
    />
  );
}
