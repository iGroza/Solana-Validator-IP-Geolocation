// StatCards: headline metrics for the visible validator set.
// Numbers are formatted (compact SOL, thousands separators) and count up on
// reveal. Rendering is client-only via useMounted() with matching-height
// skeletons so SSR/prerender stays safe.

import { useEffect, useRef, useState } from "react";
import { useValidators } from "../../state/ValidatorsContext";
import { computeTotals } from "../../csv/stats";
import { useMounted } from "../../hooks/useMounted";
import { useI18n } from "../../i18n";

const STAT_COUNT = 8;

/** Compact SOL: 12,345,678 -> "12.35M SOL". */
function formatSol(n: number): string {
  if (!Number.isFinite(n)) return "0 SOL";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B SOL`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M SOL`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K SOL`;
  return `${Math.round(n).toLocaleString("en-US")} SOL`;
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

interface StatDef {
  label: string;
  value: number;
  /** How to render the animated value. */
  kind: "sol" | "int" | "pct";
  sub?: string;
  accent?: boolean;
}

/**
 * Animate a number from 0 -> target once the element scrolls into view.
 * Respects prefers-reduced-motion (jumps straight to the target).
 */
function useCountUp(target: number, format: (n: number) => string): {
  ref: React.RefObject<HTMLSpanElement>;
  text: string;
} {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number>(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (reduced || typeof requestAnimationFrame === "undefined") {
        setDisplay(target);
        return;
      }
      const duration = 900;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(target);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return { ref, text: format(display) };
}

function StatValue({
  value,
  kind,
  accent,
}: {
  value: number;
  kind: StatDef["kind"];
  accent?: boolean;
}) {
  const format =
    kind === "sol" ? formatSol : kind === "pct" ? formatPct : formatInt;
  const { ref, text } = useCountUp(value, format);
  return (
    <span
      ref={ref}
      className={
        "stat-card__value" + (accent ? " stat-card__value--accent" : "")
      }
    >
      {text}
    </span>
  );
}

export function StatCards() {
  const { visible } = useValidators();
  const { t } = useI18n();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="stat-grid" aria-hidden="true">
        {Array.from({ length: STAT_COUNT }).map((_, i) => (
          <div key={i} className="stat-card skeleton" style={{ height: 128 }} />
        ))}
      </div>
    );
  }

  const totals = computeTotals(visible);

  const stats: StatDef[] = [
    {
      label: t("stat.totalStake"),
      value: totals.totalStakeSol,
      kind: "sol",
      sub: `${formatInt(totals.totalValidators)} ${t("stat.validators")}`,
      accent: true,
    },
    {
      label: t("stat.validators"),
      value: totals.totalValidators,
      kind: "int",
    },
    {
      label: t("stat.countries"),
      value: totals.uniqueCountries,
      kind: "int",
    },
    {
      label: t("stat.cities"),
      value: totals.uniqueCities,
      kind: "int",
    },
    {
      label: t("stat.regions"),
      value: totals.uniqueRegions,
      kind: "int",
    },
    {
      label: t("stat.hosting"),
      value: totals.uniqueHosting,
      kind: "int",
    },
    {
      label: t("stat.jitoShare"),
      value: totals.jitoStakePct,
      kind: "pct",
      sub: `${formatInt(totals.jitoCount)} ${t("stat.jitoStake")}`,
      accent: true,
    },
    {
      label: t("stat.jitoStake"),
      value: totals.jitoStakeSol,
      kind: "sol",
    },
  ];

  return (
    <div className="stat-grid">
      {stats.map((s) => (
        <div key={s.label} className="stat-card glass card">
          <span className="stat-card__label">{s.label}</span>
          <StatValue value={s.value} kind={s.kind} accent={s.accent} />
          {s.sub ? <span className="stat-card__sub">{s.sub}</span> : null}
        </div>
      ))}
    </div>
  );
}

export default StatCards;
