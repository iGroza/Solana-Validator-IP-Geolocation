// Adds the "is-visible" class to [data-reveal] elements as they scroll into
// view. SSR-safe (guards window/document) and respects prefers-reduced-motion.

import { useEffect } from "react";

export function useRevealOnScroll(dep?: unknown): void {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (elements.length === 0) return;

    // If reduced motion is preferred, reveal everything immediately.
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      for (const el of elements) el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    for (const el of elements) {
      if (el.classList.contains("is-visible")) continue;
      observer.observe(el);
    }

    return () => observer.disconnect();
    // Re-run when the dependency (e.g. data readiness) changes so newly
    // rendered [data-reveal] nodes get observed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
}
