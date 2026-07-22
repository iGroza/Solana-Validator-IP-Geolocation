// History data layer: enumerate dated GitHub releases, resolve per-day CSV URLs,
// and load/cache per-day validator snapshots for the interactive replay.
//
// Day CSVs are cached via the Cache API ("sol-history-v1"); the sorted list of
// available dates is cached in localStorage ("sol.history.dates.v1", 6h TTL).

import { DATA_START_DATE, REPO } from "../config";
import { parseCsv, ValidatorRow } from "./parse";

const PER_PAGE = 100;
const DATES_CACHE_KEY = "sol.history.dates.v1";
const DATES_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_NAME = "sol-history-v1";

interface GithubRelease {
  tag_name: string;
  draft?: boolean;
  prerelease?: boolean;
}

interface DatesCacheEntry {
  ts: number;
  dates: string[];
}

/** True when the Cache API is usable (browser client, not SSR). */
function hasCaches(): boolean {
  return typeof caches !== "undefined";
}

/** SSR-safe localStorage accessor. */
function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Read the cached dates entry from localStorage (null if absent/corrupt). */
function readDatesCache(): DatesCacheEntry | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(DATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DatesCacheEntry;
    if (
      !parsed ||
      typeof parsed.ts !== "number" ||
      !Array.isArray(parsed.dates)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Persist the dates entry to localStorage (best-effort). */
function writeDatesCache(dates: string[]): void {
  const ls = getLocalStorage();
  if (!ls) return;
  try {
    const entry: DatesCacheEntry = { ts: Date.now(), dates };
    ls.setItem(DATES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore quota / serialization failures.
  }
}

/** Extract the YYYY-MM-DD portion from a "date-YYYY-MM-DD" tag, else null. */
function tagToDate(tag: string): string | null {
  const m = tag.match(/^date-(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * List every available history date (YYYY-MM-DD) >= DATA_START_DATE.
 *
 * Paginates GitHub releases until a short page. Results are UNIQUE and sorted
 * ASCENDING. Cached in localStorage for 6h; a fresh cache is served without
 * hitting the network. On HTTP 403 (rate limit) a stale cache is returned if
 * present, otherwise a clear error is thrown.
 */
export async function listAvailableDates(): Promise<string[]> {
  const cached = readDatesCache();
  if (cached && Date.now() - cached.ts < DATES_TTL_MS) {
    return cached.dates;
  }

  const seen = new Set<string>();
  let page = 1;

  try {
    // Loop until a page returns fewer than PER_PAGE items (the last page).
    // Guard with a sane upper bound to avoid runaway loops.
    for (; page <= 1000; page++) {
      const url = `https://api.github.com/repos/${REPO}/releases?per_page=${PER_PAGE}&page=${page}`;
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
      });

      if (res.status === 403) {
        // Rate limited: serve any cached entry, else surface a clear error.
        if (cached) return cached.dates;
        throw new Error("GitHub API rate limit reached — try again later.");
      }
      if (!res.ok) {
        throw new Error(
          `Failed to list releases from GitHub (HTTP ${res.status}).`
        );
      }

      const batch = (await res.json()) as GithubRelease[];
      if (!Array.isArray(batch) || batch.length === 0) break;

      for (const rel of batch) {
        if (rel.draft) continue;
        const date = tagToDate(rel.tag_name);
        if (!date) continue;
        if (date < DATA_START_DATE) continue;
        seen.add(date);
      }

      if (batch.length < PER_PAGE) break;
    }
  } catch (err) {
    // On any network failure, fall back to a stale cache when available.
    if (cached) return cached.dates;
    throw err;
  }

  const dates = Array.from(seen).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  writeDatesCache(dates);
  return dates;
}

/** Raw CSV URL for a given history date. */
export function dayCsvUrl(date: string): string {
  return `https://raw.githubusercontent.com/${REPO}/date-${date}/solana_validators.csv`;
}

// In-memory fallback cache when the Cache API is unavailable (older browsers/SSR).
const memoryCache = new Map<string, string>();

/**
 * Fetch (or read from cache) the RAW CSV text for a given date.
 *
 * This is the single source of truth for the per-day cache: both the replay
 * prefetch/loadDay and the bulk history .zip download go through it, so a day
 * pulled for replay is reused by the download (and vice-versa) instead of being
 * fetched twice. Uses the Cache API when available; otherwise an in-memory Map.
 */
export async function getDayCsvText(date: string): Promise<string> {
  const u = dayCsvUrl(date);

  if (hasCaches()) {
    const c = await caches.open(CACHE_NAME);
    let res = await c.match(u);
    if (!res) {
      res = await fetch(u);
      if (res.ok) await c.put(u, res.clone());
    }
    if (!res.ok) {
      throw new Error(
        `Failed to load history for ${date} (HTTP ${res.status}).`
      );
    }
    return res.text();
  }

  // In-memory fallback.
  const memo = memoryCache.get(u);
  if (memo !== undefined) return memo;
  const res = await fetch(u);
  if (!res.ok) {
    throw new Error(`Failed to load history for ${date} (HTTP ${res.status}).`);
  }
  const text = await res.text();
  memoryCache.set(u, text);
  return text;
}

/**
 * Load and parse the validator snapshot for a given date (via the shared cache).
 */
export async function loadDay(date: string): Promise<ValidatorRow[]> {
  return parseCsv(await getDayCsvText(date));
}

/** Whether the given date's CSV is already present in the Cache API. */
export async function isDayCached(date: string): Promise<boolean> {
  if (!hasCaches()) return false;
  const c = await caches.open(CACHE_NAME);
  const res = await c.match(dayCsvUrl(date));
  return Boolean(res);
}

/**
 * Warm the Cache API for each date (concurrency 4). Already-cached days are
 * skipped but still counted toward `done`. `onProgress(done, total, date)` is
 * called as each day finishes. Honors an AbortSignal (stops early) and
 * tolerates per-day fetch failures (skip and continue).
 */
export async function prefetchDays(
  dates: string[],
  onProgress: (done: number, total: number, date: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const total = dates.length;
  let done = 0;
  let cursor = 0;
  const CONCURRENCY = 4;

  const useCaches = hasCaches();
  const c = useCaches ? await caches.open(CACHE_NAME) : null;

  async function worker(): Promise<void> {
    for (;;) {
      if (signal?.aborted) return;
      const index = cursor++;
      if (index >= total) return;
      const date = dates[index];
      const u = dayCsvUrl(date);

      try {
        if (c) {
          const existing = await c.match(u);
          if (!existing) {
            const res = await fetch(u, { signal });
            if (res.ok) await c.put(u, res.clone());
          }
        } else {
          // In-memory fallback path.
          if (!memoryCache.has(u)) {
            const res = await fetch(u, { signal });
            if (res.ok) memoryCache.set(u, await res.text());
          }
        }
      } catch {
        // Per-day failure (including aborts): skip and continue.
      } finally {
        done += 1;
        onProgress(done, total, date);
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(CONCURRENCY, total); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}
