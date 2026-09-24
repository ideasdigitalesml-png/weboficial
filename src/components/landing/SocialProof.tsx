// Initials-only stand-ins (no real client names/photos to fabricate) --
// purely a visual "people trust this" cue stacked next to the headline.
const AVATARS = ["MG", "JL", "AS"];

export function SocialProof() {
  return (
    <section className="bg-surface-muted px-6 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center">
        <p className="text-lg font-semibold text-navy sm:text-xl">
          Más de 50 profesionales ya tienen su página en weboficial
        </p>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {AVATARS.map((initials, i) => (
              <span
                key={initials}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-surface-muted"
                style={{
                  background: `linear-gradient(135deg, #3b82f6, #0f2044)`,
                  zIndex: AVATARS.length - i,
                }}
              >
                {initials}
              </span>
            ))}
          </div>
          <span className="text-sm text-text-body">
            Contadores · Abogados · Psicólogos
          </span>
        </div>
      </div>
    </section>
  );
}
