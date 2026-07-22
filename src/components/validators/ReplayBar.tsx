// Interactive replay controls: pick a start date + playback speed, warm the
// per-day CSV cache with an inline progress bar, then play/pause/scrub through
// history. Selecting a day drives the global replayDate, so the whole site
// (map/charts/stats/table) animates through the past.
//
// Strictly client-only: everything is gated on useMounted() and every browser
// API (timers, AbortController) runs after hydration. All labels go through i18n.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prefetchDays } from "../../csv/history";
import { useMounted } from "../../hooks/useMounted";
import { useI18n } from "../../i18n";
import { useValidators } from "../../state/ValidatorsContext";

// Playback speed → milliseconds spent on each day.
const SPEEDS: { label: string; ms: number }[] = [
  { label: "0.5x", ms: 1500 },
  { label: "1x", ms: 750 },
  { label: "2x", ms: 375 },
  { label: "4x", ms: 150 },
];
const DEFAULT_SPEED_INDEX = 1; // 1x

type Phase = "select" | "preparing" | "ready";

/** Fill {placeholder} tokens in an i18n string with real values. */
function fmt(s: string, vars: Record<string, string | number>): string {
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return out;
}

export function ReplayBar() {
  const mounted = useMounted();
  const { t } = useI18n();
  const {
    availableDates,
    loadAvailableDates,
    setReplayDate,
    replayLoading,
    isReplay,
  } = useValidators();

  const [phase, setPhase] = useState<Phase>("select");
  const [startDate, setStartDate] = useState<string>("");
  const [speedIndex, setSpeedIndex] = useState<number>(DEFAULT_SPEED_INDEX);

  // Prepared slice + playback position.
  const [slice, setSlice] = useState<string[]>([]);
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  // Prefetch progress.
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the sorted list of available dates on mount (client only).
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      try {
        const dates = await loadAvailableDates();
        if (cancelled) return;
        // Default the start date to the first available day.
        setStartDate((prev) => prev || dates[0] || "");
      } catch {
        // Rate limit / network failure: leave the picker empty & disabled.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, loadAvailableDates]);

  const minDate = availableDates[0] ?? "";
  const maxDate =
    availableDates.length > 0 ? availableDates[availableDates.length - 1] : "";
  const hasDates = availableDates.length > 0;

  const speedMs = SPEEDS[speedIndex]?.ms ?? SPEEDS[DEFAULT_SPEED_INDEX].ms;

  // Clear any pending playback timer.
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Abort an in-flight prefetch (if any).
  const abortPrefetch = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  // Reset everything back to the initial selection phase.
  const resetToSelect = useCallback(() => {
    clearTimer();
    abortPrefetch();
    setPlaying(false);
    setPhase("select");
    setSlice([]);
    setDayIndex(0);
    setProgress({ done: 0, total: 0 });
  }, [clearTimer, abortPrefetch]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimer();
      abortPrefetch();
    };
  }, [clearTimer, abortPrefetch]);

  // Build the slice from the chosen start date, warm its cache, then go "ready".
  const handlePrepare = useCallback(async () => {
    if (!mounted || !hasDates) return;

    const start = startDate || minDate;
    const startIdx = availableDates.indexOf(start);
    const from = startIdx >= 0 ? startIdx : 0;
    const nextSlice = availableDates.slice(from);
    if (nextSlice.length === 0) return;

    setSlice(nextSlice);
    setDayIndex(0);
    setProgress({ done: 0, total: nextSlice.length });
    setPhase("preparing");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await prefetchDays(
        nextSlice,
        (done, total) => {
          if (controller.signal.aborted) return;
          setProgress({ done, total });
        },
        controller.signal
      );
    } catch {
      // Tolerate prefetch failure; individual days fall back to load-on-scrub.
    }

    if (controller.signal.aborted) return;
    abortRef.current = null;

    // Enter the ready state and show the first day immediately.
    setPhase("ready");
    setDayIndex(0);
    setReplayDate(nextSlice[0]);
  }, [mounted, hasDates, startDate, minDate, availableDates, setReplayDate]);

  // Advance to a specific index: update local position + drive the global date.
  const goToIndex = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(slice.length - 1, idx));
      setDayIndex(clamped);
      setReplayDate(slice[clamped] ?? null);
    },
    [slice, setReplayDate]
  );

  // Playback loop: while playing, advance one day every `speedMs`. Depends on
  // dayIndex/speedMs so changing speed mid-playback re-arms with the new delay.
  useEffect(() => {
    if (phase !== "ready" || !playing) {
      clearTimer();
      return;
    }
    if (dayIndex >= slice.length - 1) {
      // Reached the end: stop (do not loop).
      setPlaying(false);
      clearTimer();
      return;
    }
    timerRef.current = setTimeout(() => {
      goToIndex(dayIndex + 1);
    }, speedMs);
    return () => clearTimer();
  }, [phase, playing, dayIndex, speedMs, slice.length, goToIndex, clearTimer]);

  const togglePlay = useCallback(() => {
    if (dayIndex >= slice.length - 1) {
      // Restart from the beginning when pressing play at the end.
      goToIndex(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [dayIndex, slice.length, goToIndex]);

  const handleExit = useCallback(() => {
    setReplayDate(null);
    resetToSelect();
  }, [setReplayDate, resetToSelect]);

  const prepPct = useMemo(() => {
    if (progress.total <= 0) return 0;
    return Math.min(100, Math.round((progress.done / progress.total) * 100));
  }, [progress]);

  // Keep body/nav replay accent in sync with global replay mode.
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    document.body.classList.toggle("is-replay", isReplay);
    return () => {
      document.body.classList.remove("is-replay");
    };
  }, [mounted, isReplay]);

  // SSR / pre-hydration: render nothing so the fixed bar only appears after
  // hydration (avoids a flash of an inert player during prerender).
  if (!mounted) return null;

  const currentDate = slice[dayIndex] ?? "";
  const atEnd = dayIndex >= slice.length - 1;

  const speedChips = (
    <span
      className="replay-player__speeds"
      role="group"
      aria-label={t("replay.speed")}
    >
      {SPEEDS.map((s, i) => (
        <button
          key={s.label}
          type="button"
          className={"replay__speed" + (i === speedIndex ? " is-active" : "")}
          aria-pressed={i === speedIndex}
          onClick={() => setSpeedIndex(i)}
        >
          {s.label}
        </button>
      ))}
    </span>
  );

  return (
    <div
      className={"replay-player" + (isReplay ? " is-active" : "")}
      role="region"
      aria-label={t("replay.badge")}
    >
      <div className="replay-player__inner">
        <span className="replay-player__badge">
          <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
          <span className="replay-player__badge-text">{t("replay.badge")}</span>
        </span>

        {phase === "select" && (
          <div className="replay-player__row">
            <label className="replay-player__field">
              <span className="replay-player__k">{t("replay.selectStart")}</span>
              <input
                className="replay__date"
                type="date"
                min={minDate}
                max={maxDate}
                value={startDate}
                disabled={!hasDates}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>

            <label className="replay-player__field">
              <span className="replay-player__k">{t("replay.speed")}</span>
              {speedChips}
            </label>

            <button
              type="button"
              className="btn btn--primary btn--sm replay-player__cta"
              onClick={handlePrepare}
              disabled={!hasDates}
              title={t("replay.hint")}
            >
              <i className="fa-solid fa-play" aria-hidden="true" />
              {t("replay.prepare")}
            </button>
          </div>
        )}

        {phase === "preparing" && (
          <div className="replay-player__row replay-player__row--prep">
            <span className="replay-player__status" aria-live="polite">
              {fmt(t("replay.preparing"), {
                done: progress.done,
                total: progress.total,
              })}
            </span>
            <div
              className="replay-player__bar-progress"
              role="progressbar"
              aria-label={t("replay.prepare")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={prepPct}
            >
              <div
                className="replay-player__bar-fill"
                style={{ width: `${Math.max(2, prepPct)}%` }}
              />
            </div>
            <span className="replay-player__pct">{prepPct}%</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleExit}
            >
              {t("replay.exit")}
            </button>
          </div>
        )}

        {phase === "ready" && (
          <div className="replay-player__row replay-player__row--play">
            <button
              type="button"
              className="replay__play"
              onClick={togglePlay}
              aria-label={playing ? t("replay.pause") : t("replay.play")}
              aria-pressed={playing}
            >
              <i
                className={
                  playing
                    ? "fa-solid fa-pause"
                    : atEnd
                    ? "fa-solid fa-rotate-left"
                    : "fa-solid fa-play"
                }
                aria-hidden="true"
              />
            </button>

            <span
              className="replay-player__day"
              aria-live="polite"
              aria-busy={replayLoading}
            >
              <b>{currentDate}</b>
              <span className="replay-player__daycount">
                {fmt(t("replay.day"), { i: dayIndex + 1, n: slice.length })}
              </span>
            </span>

            <input
              className="replay__slider replay-player__slider"
              type="range"
              min={0}
              max={Math.max(0, slice.length - 1)}
              step={1}
              value={dayIndex}
              onChange={(e) => {
                setPlaying(false);
                goToIndex(Number(e.target.value));
              }}
              aria-label={t("replay.badge")}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, slice.length - 1)}
              aria-valuenow={dayIndex}
              aria-valuetext={currentDate}
            />

            {speedChips}

            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleExit}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
              <span className="replay-player__exit-text">{t("replay.exit")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReplayBar;
