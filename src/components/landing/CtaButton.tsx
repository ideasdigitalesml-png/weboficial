import Link from "next/link";

// The one action on this page, reused verbatim in the hero and the final
// CTA -- same text, same style, same destination. Points straight at the
// onboarding wizard (no login wall first) per the registration-flow
// refactor: visitors fill the form and see their page before ever being
// asked to sign in. Sky is reserved for exactly this kind of small,
// high-intent surface per the 60-30-10 rule, never a large background,
// and min-h-11 keeps the tap target at the 44px accessibility minimum.
export function CtaButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/onboarding"
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-sky px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-sky-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky ${className}`}
    >
      Creá tu página
    </Link>
  );
}
