import Image from "next/image";
import Link from "next/link";

// "Ejemplo de diseño" (not "Ver ejemplo") on every card below because no
// landing has been published yet (checked directly in the DB -- zero rows
// with status = 'published'). Swap a card's label/href to a real published
// slug once that profession has one; never fabricate a client name or URL
// here in the meantime.
const PROFESSIONS = [
  {
    name: "Contadores",
    href: "/contadores",
    image: "/previews/contador-moderno.jpg",
  },
  {
    name: "Abogados",
    href: "/abogados",
    image: "/previews/abogado-moderno.jpg",
  },
  {
    name: "Psicólogos",
    href: "/psicologos",
    image: "/previews/psicologo-moderno.jpg",
  },
] as const;

export function ProfessionShowcase() {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          Así puede quedar tu página profesional
        </h2>
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
                <span className="text-sm text-text-body transition-colors group-hover:text-sky">
                  Ejemplo de diseño
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-sky transition-colors hover:text-sky-dark"
          >
            Crear mi página
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
