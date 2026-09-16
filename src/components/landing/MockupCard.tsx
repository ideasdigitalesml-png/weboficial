// A CSS/HTML-only stand-in for a real template screenshot -- no image
// asset, so nothing to break the build if a file is missing. Once a real
// profession template exists, swap this for an actual screenshot; until
// then this gives prospects the "browser window previewing a page" cue
// without claiming to be a specific real design.
export function MockupCard() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-xl shadow-navy/10">
      <div className="flex items-center gap-1.5 border-b border-border-subtle bg-surface-muted px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
        <span className="ml-3 h-5 flex-1 rounded-full bg-white" />
      </div>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 shrink-0 rounded-full bg-navy/10" />
          <div className="flex flex-1 flex-col gap-2">
            <span className="h-3 w-2/5 rounded-full bg-navy/80" />
            <span className="h-2.5 w-1/3 rounded-full bg-navy/20" />
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <span className="h-2.5 w-full rounded-full bg-navy/10" />
          <span className="h-2.5 w-11/12 rounded-full bg-navy/10" />
          <span className="h-2.5 w-4/5 rounded-full bg-navy/10" />
        </div>
        <span className="mt-2 h-9 w-32 rounded-full bg-sky" />
      </div>
    </div>
  );
}
