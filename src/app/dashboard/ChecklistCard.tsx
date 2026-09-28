import Link from "next/link";

export interface ChecklistStep {
  label: string;
  done: boolean;
  href: string;
}

// Reused verbatim as the data source for both the progress bar and the list
// below it -- steps are computed from real landing/subscription/form_data
// state by the caller (Inicio page), never tracked/ticked independently.
export function ChecklistCard({ steps }: { steps: ChecklistStep[] }) {
  const completed = steps.filter((step) => step.done).length;
  const total = steps.length;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-subtle p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy">Pasos para dejar lista tu página</h2>
        <span className="shrink-0 text-sm font-medium text-text-body">
          {completed}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-sky transition-[width]"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
      <ul className="flex flex-col gap-1">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-muted"
            >
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : "border border-border-subtle"
                }`}
              >
                {step.done ? "✓" : ""}
              </span>
              <span className={step.done ? "text-text-body" : "font-medium text-navy"}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
