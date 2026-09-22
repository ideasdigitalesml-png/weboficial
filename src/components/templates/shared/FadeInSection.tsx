"use client";

import { useEffect, useRef, useState } from "react";

// Shared scroll-reveal wrapper for every premium template (abogado/contador,
// all layouts). Uses IntersectionObserver directly instead of a library --
// this is the only animation primitive templates need, and pulling in
// framer-motion (not currently a dependency) for a single fade+rise effect
// would be a heavier addition than writing the ~15 lines here.
//
// Respects prefers-reduced-motion by skipping the initial hidden state
// entirely (renders already-visible) rather than animating.
export function FadeInSection({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Reduced-motion preference is read lazily here (not via setState inside
  // the effect below) so there's nothing to synchronize on mount for that
  // case -- the effect only ever calls setIsVisible from the
  // IntersectionObserver's own callback, i.e. in response to an external
  // system update, which is what that hook is for.
  const [isVisible, setIsVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity .6s ease ${delayMs}ms, transform .6s ease ${delayMs}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
