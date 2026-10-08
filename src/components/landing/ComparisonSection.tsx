const ROWS = [
  { label: "Tiempo", dev: "Semanas", web: "10 minutos" },
  { label: "Costo", dev: "Pago inicial alto + mantenimiento", web: "$13.400/mes, todo incluido" },
  { label: "Cambios", dev: "Le escribís y esperás", web: "Los hacés vos, al instante" },
  { label: "Turnos online", dev: "Desarrollo aparte", web: "Incluido" },
  { label: "Hosting y seguridad (SSL)", dev: "Aparte", web: "Incluido" },
] as const;

// No competitor named, as instructed -- "Contratar un programador" is a
// category, not a brand. Mobile gets one card per row instead of a
// horizontally-scrolling table (each card stacks the two answers), desktop
// gets the real 3-column table.
export function ComparisonSection() {
  return (
    <section className="bg-surface-muted px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
          ¿Programador o weboficial?
        </h2>

        <div className="flex flex-col gap-3 sm:hidden">
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-border-subtle bg-white p-4"
            >
              <p className="text-sm font-semibold text-navy">{row.label}</p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                <span className="text-text-body">
                  Contratar un programador: {row.dev}
                </span>
                <span className="font-semibold text-sky">
                  weboficial: {row.web}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-border-subtle bg-white sm:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted">
                <th className="px-5 py-3 text-sm font-semibold text-navy" />
                <th className="px-5 py-3 text-sm font-semibold text-navy">
                  Contratar un programador
                </th>
                <th className="px-5 py-3 text-sm font-semibold text-sky">
                  weboficial
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border-subtle last:border-0">
                  <td className="px-5 py-3 text-sm font-semibold text-navy">
                    {row.label}
                  </td>
                  <td className="px-5 py-3 text-sm text-text-body">{row.dev}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-navy">
                    {row.web}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
