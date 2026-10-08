import Image from "next/image";
import Link from "next/link";

// Each card opens the full, navigable demo page for that profession
// (/ejemplo/*, rendering the real template with a fictional profile --
// see src/lib/demo-profiles.ts) instead of the /contadores-style
// marketing page, so a visitor sees an actual page, not just a screenshot.
const PROFESSIONS = [
  {
    name: "Contadores",
    href: "/ejemplo/contador",
    image: "/previews/contador-moderno.jpg",
  },
  {
    name: "Abogados",
    href: "/ejemplo/abogado",
    image: "/previews/abogado-moderno.jpg",
  },
  {
    name: "Psicólogos",
    href: "/ejemplo/psicologo",
    image: "/previews/psicologo-moderno.jpg",
  },
] as const;

export function ProfessionShowcase() {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Diseños que te hacen ver como un profesional serio
          </h2>
          <p className="max-w-xl text-base text-text-body sm:text-lg">
            Plantillas pensadas para tu profesión. Elegís una y la completás
            con tus datos.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {PROFESSIONS.map((profession, index) => (
            <Link
              key={profession.name}
              href={profession.href}
              className="group overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <Image
                src={profession.image}
                alt={`Ejemplo de diseño para ${profession.name.toLowerCase()}`}
                width={480}
                height={300}
                className="h-auto w-full"
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
              />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-navy">
                  {profession.name}
                </span>
                <span className="text-sm font-semibold text-sky transition-colors group-hover:text-sky-dark">
                  Ver ejemplo
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
