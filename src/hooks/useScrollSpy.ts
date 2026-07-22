// Tracks which of the given section ids is currently active in the viewport.
// Robust "last-passed-offset" logic: the active id is the LAST id whose element
// top has scrolled above 35% of the viewport height. At the very bottom of the
// page we force the last id so the final tab always highlights.
// SSR-safe: returns the first id until mounted.

import { useEffect, useState } from "react";

export function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (ids.length === 0) return;

    let frame = 0;

    const compute = () => {
      frame = 0;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const innerHeight = window.innerHeight || 0;
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight || 0;

      // At the very bottom of the page, force the last id.
      if (scrollY + innerHeight >= scrollHeight - 2) {
        const last = ids[ids.length - 1];
        setActive((prev) => (prev === last ? prev : last));
        return;
      }

      const line = innerHeight * 0.35;
      let current = ids[0];

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) {
          current = id;
        }
      }

      setActive((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(compute);
    };

    // Initial computation on mount.
    compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  return active;
}
