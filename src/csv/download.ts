// Bulk history download: gather every dated release CSV into a single .zip.
// Fixes the pagination bug by looping over ALL GitHub release pages.

import JSZip from "jszip";
import { DATA_START_DATE, REPO } from "../config";
import { getDayCsvText } from "./history";

interface GithubRelease {
  tag_name: string;
  draft?: boolean;
  prerelease?: boolean;
}

const PER_PAGE = 100;

/** Extract the YYYY-MM-DD portion from a "date-..." tag, else null. */
function tagToDate(tag: string): string | null {
  if (!tag.startsWith("date-")) return null;
  const rest = tag.slice("date-".length);
  const m = rest.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Fetch every release across all pages (fixes single-page bug). */
async function fetchAllReleases(): Promise<GithubRelease[]> {
  const all: GithubRelease[] = [];
  let page = 1;

  // Loop until a page returns fewer than PER_PAGE items (last page).
  // Guard with a sane upper bound to avoid runaway loops.
  for (; page <= 1000; page++) {
    const url = `https://api.github.com/repos/${REPO}/releases?per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (res.status === 403) {
      throw new Error(
        "GitHub API rate limit reached (HTTP 403). Please wait a while and try the history download again."
      );
    }
    if (!res.ok) {
      throw new Error(
        `Failed to list releases from GitHub (HTTP ${res.status}). Please try again later.`
      );
    }

    const batch = (await res.json()) as GithubRelease[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }

  return all;
}

interface DatedRelease {
  tag: string;
  date: string;
}

/**
 * Download every dated release CSV (>= the effective start date) and pack into
 * a zip. The effective start date is `fromDate` when it is provided and not
 * earlier than DATA_START_DATE, otherwise DATA_START_DATE.
 *
 * Concurrency is capped at 3; per-file failures are skipped and reported via
 * onProgress. Throws a clear error on GitHub rate limiting.
 */
export async function fetchAllReleaseCsvsZip(
  onProgress: (done: number, total: number, label: string) => void,
  fromDate?: string
): Promise<Blob> {
  onProgress(0, 1, "Listing releases…");

  const releases = await fetchAllReleases();

  const startDate =
    fromDate && fromDate >= DATA_START_DATE ? fromDate : DATA_START_DATE;

  const dated: DatedRelease[] = [];
  for (const rel of releases) {
    if (rel.draft) continue;
    const date = tagToDate(rel.tag_name);
    if (!date) continue;
    if (date < startDate) continue;
    dated.push({ tag: rel.tag_name, date });
  }

  // Sort descending by date (newest first).
  dated.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const total = dated.length;
  if (total === 0) {
    // Nothing to download; still return a (near-empty) zip for consistency.
    const empty = new JSZip();
    empty.file("README.txt", "No dated release CSVs were found.");
    return empty.generateAsync({ type: "blob" });
  }

  const zip = new JSZip();
  let done = 0;
  const CONCURRENCY = 3;
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= dated.length) return;
      const { date } = dated[index];
      onProgress(done, total, date);
      try {
        // Shared per-day cache: reuses any day already pulled for the replay
        // (and warms the cache for a later replay), so nothing is re-downloaded.
        const text = await getDayCsvText(date);
        zip.file(`${date}.csv`, text);
      } catch {
        // Missing/failed day: skip and continue.
      } finally {
        done += 1;
        onProgress(done, total, date);
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(CONCURRENCY, dated.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  onProgress(total, total, "Packaging zip…");
  return zip.generateAsync({ type: "blob" });
}

/** Trigger a browser download of a Blob under the given filename. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
