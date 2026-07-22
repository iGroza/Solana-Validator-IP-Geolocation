// Global validators data store: fetches live CSV (with local fallback),
// parses it, exposes filtered "visible" rows and a Jito-only toggle.
//
// Also powers the interactive replay: an optional replayDate loads a historical
// per-day snapshot (via ../csv/history) that transparently replaces the live
// dataset everywhere downstream (map/charts/stats/table all read `visible`).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LAST_UPDATE_URL, LOCAL_CSV_URL, RAW_CSV_URL } from "../config";
import { parseCsv, type ValidatorRow } from "../csv/parse";
import { listAvailableDates, loadDay } from "../csv/history";

interface ValidatorsContextValue {
  // Backwards-compatible fields.
  rows: ValidatorRow[]; // === liveRows (compat alias)
  visible: ValidatorRow[];
  loading: boolean;
  error: string | null;
  jitoOnly: boolean;
  setJitoOnly: (b: boolean) => void;
  lastUpdate: string | null;
  reload: () => void;

  // Replay extension.
  liveRows: ValidatorRow[];
  availableDates: string[];
  loadAvailableDates: () => Promise<string[]>;
  replayDate: string | null;
  setReplayDate: (d: string | null) => void;
  replayLoading: boolean;
  isReplay: boolean;
}

const ValidatorsContext = createContext<ValidatorsContextValue | null>(null);

async function fetchCsvText(): Promise<string> {
  // Try the live raw CSV first, then fall back to the bundled local copy.
  try {
    const res = await fetch(RAW_CSV_URL, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) return text;
    }
  } catch {
    // Ignore and try fallback below.
  }

  const res = await fetch(LOCAL_CSV_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load validator data (HTTP ${res.status}).`);
  }
  return res.text();
}

async function fetchLastUpdate(): Promise<string | null> {
  try {
    const res = await fetch(LAST_UPDATE_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { timestamp?: string };
    return json?.timestamp ?? null;
  } catch {
    return null;
  }
}

export function ValidatorsProvider({ children }: { children: ReactNode }) {
  const [liveRows, setLiveRows] = useState<ValidatorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jitoOnly, setJitoOnly] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Replay state.
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [replayDate, setReplayDate] = useState<string | null>(null);
  const [replayRows, setReplayRows] = useState<ValidatorRow[]>([]);
  const [replayLoading, setReplayLoading] = useState<boolean>(false);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    // Client-only: fetch does not run during SSR/prerender.
    if (typeof window === "undefined") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const text = await fetchCsvText();
        if (cancelled) return;
        const parsed = parseCsv(text);
        setLiveRows(parsed);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setLiveRows([]);
        setError(
          err instanceof Error ? err.message : "Failed to load validator data."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // last_update is best-effort; failure is ignored.
    (async () => {
      const ts = await fetchLastUpdate();
      if (!cancelled) setLastUpdate(ts);
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Lazily load and memoize the sorted list of available history dates.
  // Safe to call repeatedly: subsequent calls return the already-loaded list.
  const datesPromiseRef = useRef<Promise<string[]> | null>(null);
  const availableDatesRef = useRef<string[]>(availableDates);
  availableDatesRef.current = availableDates;

  const loadAvailableDates = useCallback(async (): Promise<string[]> => {
    if (availableDatesRef.current.length > 0) {
      return availableDatesRef.current;
    }
    if (datesPromiseRef.current) {
      return datesPromiseRef.current;
    }
    const p = (async () => {
      try {
        const dates = await listAvailableDates();
        setAvailableDates(dates);
        return dates;
      } catch (err) {
        // Allow a later retry by clearing the in-flight promise.
        datesPromiseRef.current = null;
        throw err;
      }
    })();
    datesPromiseRef.current = p;
    return p;
  }, []);

  // Load the selected replay day. Do NOT clear old replayRows first (avoids
  // flicker); on error keep the prior snapshot.
  useEffect(() => {
    if (replayDate === null) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    setReplayLoading(true);

    (async () => {
      try {
        const rows = await loadDay(replayDate);
        if (cancelled) return;
        setReplayRows(rows);
      } catch {
        // Keep the prior replayRows on failure.
      } finally {
        if (!cancelled) setReplayLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [replayDate]);

  const isReplay = replayDate !== null;
  const activeRows = isReplay ? replayRows : liveRows;

  const visible = useMemo(
    () =>
      jitoOnly
        ? activeRows.filter((r) => r.IsJito === "true")
        : activeRows,
    [activeRows, jitoOnly]
  );

  const value = useMemo<ValidatorsContextValue>(
    () => ({
      rows: liveRows,
      visible,
      loading,
      error,
      jitoOnly,
      setJitoOnly,
      lastUpdate,
      reload,
      liveRows,
      availableDates,
      loadAvailableDates,
      replayDate,
      setReplayDate,
      replayLoading,
      isReplay,
    }),
    [
      liveRows,
      visible,
      loading,
      error,
      jitoOnly,
      lastUpdate,
      reload,
      availableDates,
      loadAvailableDates,
      replayDate,
      replayLoading,
      isReplay,
    ]
  );

  return (
    <ValidatorsContext.Provider value={value}>
      {children}
    </ValidatorsContext.Provider>
  );
}

export function useValidators(): ValidatorsContextValue {
  const ctx = useContext(ValidatorsContext);
  if (!ctx) {
    throw new Error("useValidators must be used within a <ValidatorsProvider>.");
  }
  return ctx;
}
