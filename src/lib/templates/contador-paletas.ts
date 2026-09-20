// Curated color palettes for the Contador "Moderno" template. A fixed set
// rather than a free color picker -- every combination here has been
// checked for contrast/legibility against the template's markup, which a
// free picker can't guarantee. Each palette supplies every CSS variable
// ContadorModernoTemplate consumes, so switching palettes never leaves a
// stale value from a previous selection.
export interface ContadorPaleta {
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

export const CONTADOR_PALETAS: ContadorPaleta[] = [
  {
    id: "bosque",
    nombre: "Bosque",
    preview: ["#0B2545", "#1A6B4A", "#EAF4EF"],
    variables: {
      "--c-primary": "#0B2545",
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
    id: "marino",
    nombre: "Marino",
    preview: ["#1A3A5C", "#2E86C1", "#EBF5FB"],
    variables: {
      "--c-primary": "#1A3A5C",
      "--c-accent": "#2E86C1",
      "--c-accent-lt": "#EBF5FB",
      "--c-bg": "#FFFFFF",
      "--c-bg2": "#F4F8FB",
      "--c-text": "#0D1B2A",
      "--c-muted": "#64748B",
      "--c-border": "#D6E8F5",
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

export const DEFAULT_CONTADOR_PALETA_ID = "bosque";

export function findContadorPaleta(id: string | null | undefined): ContadorPaleta {
  return (
    CONTADOR_PALETAS.find((p) => p.id === id) ??
    CONTADOR_PALETAS.find((p) => p.id === DEFAULT_CONTADOR_PALETA_ID)!
  );
}
