// No client count here -- there's no metric backing a number, so this
// stays a qualitative line instead of a fabricated "+N profesionales".
export function SocialProof() {
  return (
    <section className="bg-surface-muted px-6 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center">
        <p className="text-lg font-semibold text-navy sm:text-xl">
          Profesionales de todo el país ya están creando su página
        </p>
        <span className="text-sm text-text-body">
          Contadores · Abogados · Psicólogos
        </span>
      </div>
    </section>
  );
}
