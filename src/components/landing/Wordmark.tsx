// Brand mark: "weboficial" as a single type piece, with both "i"s in
// "oficial" set in sky blue as the distinctive brand gesture -- that accent
// stays sky regardless of where the mark sits. `tone` controls the rest of
// the word: navy on light backgrounds (the default, everywhere except the
// footer), white on the navy footer background. Keep this component as the
// only place the wordmark is built, so every appearance stays identical.
export function Wordmark({
  tone = "navy",
  className = "",
}: {
  tone?: "navy" | "white";
  className?: string;
}) {
  const baseColor = tone === "navy" ? "text-navy" : "text-white";

  return (
    <span
      className={`font-display font-bold tracking-[-0.02em] ${baseColor} ${className}`}
    >
      webof
      <span className="text-sky">i</span>
      c<span className="text-sky">i</span>al
    </span>
  );
}
