import { useEffect, useRef } from 'react';
import './AuroraBackground.css';

/**
 * Living atmospheric background: slowly drifting Solana-tinted aurora blobs
 * (purple -> green -> cyan) plus an interactive glow that follows the cursor.
 *
 * SSR-safe: the drift is pure CSS, and the cursor interaction only attaches
 * after mount (guards window). Respects prefers-reduced-motion and coarse
 * pointers (touch devices keep the static drift, no cursor glow).
 */
export const AuroraBackground = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.3;
    let x = targetX;
    let y = targetY;

    const loop = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      el.style.setProperty('--mx', `${x.toFixed(1)}px`);
      el.style.setProperty('--my', `${y.toFixed(1)}px`);
      if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    };

    el.classList.add('aurora--interactive');
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="aurora" ref={ref} aria-hidden="true">
      <span className="aurora__blob aurora__blob--1" />
      <span className="aurora__blob aurora__blob--2" />
      <span className="aurora__blob aurora__blob--3" />
      <span className="aurora__cursor" />
      <span className="aurora__grain" />
    </div>
  );
};
