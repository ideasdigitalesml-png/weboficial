import { readFile } from "node:fs/promises";
import path from "node:path";

// Static per-profession tab icons (public/icons/profesiones/*.svg + the
// pre-rendered 180x180 PNGs alongside them) -- only the 3 professions this
// app actually supports have one. Any other/unknown profession slug falls
// back to weboficial's own icon.svg/apple-icon.png (src/app/), never to a
// generated placeholder.
const PROFESSIONS_WITH_ICON = new Set(["abogados", "contadores", "psicologos"]);

const PROFESSIONES_DIR = path.join(process.cwd(), "public", "icons", "profesiones");
const APP_DIR = path.join(process.cwd(), "src", "app");

export async function getProfessionIconSvg(professionSlug: string | null): Promise<Buffer> {
  if (professionSlug && PROFESSIONS_WITH_ICON.has(professionSlug)) {
    return readFile(path.join(PROFESSIONES_DIR, `${professionSlug}.svg`));
  }
  return readFile(path.join(APP_DIR, "icon.svg"));
}

export async function getProfessionAppleIconPng(professionSlug: string | null): Promise<Buffer> {
  if (professionSlug && PROFESSIONS_WITH_ICON.has(professionSlug)) {
    return readFile(path.join(PROFESSIONES_DIR, `${professionSlug}-apple.png`));
  }
  return readFile(path.join(APP_DIR, "apple-icon.png"));
}
