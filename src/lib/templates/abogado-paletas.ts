// Curated color palettes for the Abogado "Moderno" template. Same shape
// and CSS variable set as contador-paletas.ts (both templates share the
// --c-* variable convention), but built around the navy/dorado base the
// abogado template family already uses (see templates.config seed for
// 'moderno': primaryColor #1C1C2E, secondaryColor #C9A84C).
export interface AbogadoPaleta {
  id: string;
  nombre: string;
  preview: [primary: string, accent: string, accentLt: string];
  variables: {
    "--c-primary": string;
    "--c-accent": string;
    "--c-accent-lt": string;
    "--c-bg": string;
    "--c-bg2": string;
    "--c-text": string;
    "--c-muted": string;
    "--c-border": string;
  };
}

export const ABOGADO_PALETAS: AbogadoPaleta[] = [
  {
    id: "bosque",
    nombre: "Bosque",
    preview: ["#1C1C2E", "#1A6B4A", "#EAF4EF"],
    variables: {
      "--c-primary": "#1C1C2E",
      "--c-accent": "#1A6B4A",
      "--c-accent-lt": "#EAF4EF",
      "--c-bg": "#FFFFFF",
      "--c-bg2": "#F7F8FA",
      "--c-text": "#0B1120",
      "--c-muted": "#64748B",
      "--c-border": "#E2E8F0",
    },
  },
  {
    id: "dorado",
    nombre: "Dorado",
    preview: ["#1C1C2E", "#C9A84C", "#FDF6E3"],
    variables: {
      "--c-primary": "#1C1C2E",
      "--c-accent": "#C9A84C",
      "--c-accent-lt": "#FDF6E3",
      "--c-bg": "#FFFFFF",
      "--c-bg2": "#F7F8FA",
      "--c-text": "#0F0F1A",
      "--c-muted": "#64748B",
      "--c-border": "#E2E8F0",
    },
  },
  {
    id: "carbono",
    nombre: "Carbono",
    preview: ["#1C1C2E", "#E63946", "#FEE9EA"],
    variables: {
      "--c-primary": "#1C1C2E",
      "--c-accent": "#E63946",
      "--c-accent-lt": "#FEE9EA",
      "--c-bg": "#FFFFFF",
      "--c-bg2": "#F8F8FA",
      "--c-text": "#0F0F1A",
      "--c-muted": "#64748B",
      "--c-border": "#E2E2EA",
    },
  },
  {
    id: "tierra",
    nombre: "Tierra",
    preview: ["#3D2B1F", "#C0783C", "#FBF0E6"],
    variables: {
      "--c-primary": "#3D2B1F",
      "--c-accent": "#C0783C",
      "--c-accent-lt": "#FBF0E6",
      "--c-bg": "#FDFAF7",
      "--c-bg2": "#F5EFE8",
      "--c-text": "#1A0E08",
      "--c-muted": "#8A7060",
      "--c-border": "#E8D9C8",
    },
  },
];

// 'dorado' (not 'bosque') is the default here -- it matches the navy/gold
// this profession's Moderno template already shipped with (see
// templates.config seed), so a landing that never touches the palette
// selector keeps looking the way it always did.
export const DEFAULT_ABOGADO_PALETA_ID = "dorado";

export function findAbogadoPaleta(id: string | null | undefined): AbogadoPaleta {
  return (
    ABOGADO_PALETAS.find((p) => p.id === id) ??
    ABOGADO_PALETAS.find((p) => p.id === DEFAULT_ABOGADO_PALETA_ID)!
  );
}
