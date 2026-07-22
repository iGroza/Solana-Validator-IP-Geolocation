// Download controls: latest-CSV link, a full-history .zip export, and a Jito
// filter toggle. The history export opens a small config modal (how many LAST
// days, default "all") and then runs entirely in the BACKGROUND, reporting via
// an animated toast — nothing blocks the page. Days are pulled through the
// shared per-day cache, so anything already fetched for the replay is reused.

import { useCallback, useEffect, useMemo, useState } from "react";
import { RAW_CSV_URL } from "../../config";
import {
  fetchAllReleaseCsvsZip,
  triggerBlobDownload,
} from "../../csv/download";
import { useMounted } from "../../hooks/useMounted";
import { useI18n } from "../../i18n";
import { useToast } from "../common/Toast";
import { useValidators } from "../../state/ValidatorsContext";

/** Fill {placeholder} tokens in an i18n string with real values. */
function fmt(s: string, vars: Record<string, string | number>): string {
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return out;
}

export function DownloadBar() {
  const mounted = useMounted();
  const { t } = useI18n();
  const toast = useToast();
  const { jitoOnly, setJitoOnly, availableDates, loadAvailableDates } =
    useValidators();

  const [modalOpen, setModalOpen] = useState(false);
  // Selected range: a number of last-N days, or "all".
  const [range, setRange] = useState<number | "all">("all");

  // Load the available-dates index once mounted (for the count + presets).
  useEffect(() => {
    if (!mounted) return;
    loadAvailableDates().catch(() => {});
  }, [mounted, loadAvailableDates]);

  const total = availableDates.length;
  const from = availableDates[0] ?? "";
  const to = availableDates[total - 1] ?? "";
  const hasDates = total > 0;

  // Preset "last N days" chips, only those that fit the available range.
  const presets = useMemo(
    () => [7, 30, 90, 365].filter((n) => n < total),
    [total]
  );

  const startHistoryDownload = useCallback(() => {
    setModalOpen(false);

    // Translate the chosen range into a start date (undefined = all history).
    const fromDate =
      range === "all"
        ? undefined
        : availableDates[Math.max(0, total - range)];

    const id = toast.push({
      variant: "info",
      icon: "fa-box-archive",
      title: t("download.building"),
      progress: 0,
      sticky: true,
    });

    (async () => {
      try {
        const blob = await fetchAllReleaseCsvsZip((done, tot, label) => {
          const pct = tot > 0 ? Math.round((done / tot) * 100) : 0;
          toast.update(id, {
            progress: pct,
            message: fmt(t("download.progress"), {
              done,
              total: tot,
              date: label,
            }),
          });
        }, fromDate);

        triggerBlobDownload(blob, "solana_validators_history.zip");
        toast.update(id, {
          variant: "success",
          icon: "fa-circle-check",
          title: t("download.ready"),
          message: "",
          progress: 100,
          sticky: false,
        });
      } catch (err) {
        toast.update(id, {
          variant: "error",
          icon: "fa-triangle-exclamation",
          title: t("download.failed"),
          message:
            err instanceof Error ? err.message : String(err ?? "error"),
          progress: null,
          sticky: false,
        });
      }
    })();
  }, [range, availableDates, total, toast, t]);

  return (
    <>
      <div className="download-bar">
        <a
          className="btn btn--primary"
          href={RAW_CSV_URL}
          download="solana_validators.csv"
          rel="noopener"
        >
          <i className="fa-solid fa-file-csv" aria-hidden="true" />
          {t("download.latest")}
        </a>

        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setModalOpen(true)}
          disabled={!mounted || !hasDates}
          title={hasDates ? undefined : t("download.loadingHistory")}
        >
          <i
            className={
              mounted && !hasDates
                ? "fa-solid fa-spinner fa-spin"
                : "fa-solid fa-box-archive"
            }
            aria-hidden="true"
          />
          {t("download.history")}
        </button>

        <span className="download-bar__spacer" />

        <label className="toggle">
          <input
            type="checkbox"
            checked={jitoOnly}
            onChange={(e) => setJitoOnly(e.target.checked)}
          />
          <span className="toggle__track" aria-hidden="true" />
          <span>{t("toggle.jitoOnly")}</span>
        </label>
      </div>

      {hasDates && (
        <p className="download-bar__meta">
          {fmt(t("download.daysAvailable"), { n: total, from, to })}
        </p>
      )}

      {modalOpen && (
        <div
          className="dl-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t("download.howMuch")}
          onClick={() => setModalOpen(false)}
        >
          <div className="dl-modal__panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="dl-modal__title">{t("download.howMuch")}</h3>
            {hasDates && (
              <p className="dl-modal__sub">
                {fmt(t("download.daysAvailable"), { n: total, from, to })}
              </p>
            )}

            <div className="dl-modal__choices" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={range === "all"}
                className={"dl-chip" + (range === "all" ? " is-active" : "")}
                onClick={() => setRange("all")}
              >
                {fmt(t("download.all"), { n: total })}
              </button>
              {presets.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={range === n}
                  className={"dl-chip" + (range === n ? " is-active" : "")}
                  onClick={() => setRange(n)}
                >
                  {fmt(t("download.lastN"), { n })}
                </button>
              ))}
            </div>

            <div className="dl-modal__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setModalOpen(false)}
              >
                {t("download.cancel")}
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={startHistoryDownload}
                disabled={!hasDates}
              >
                <i className="fa-solid fa-download" aria-hidden="true" />
                {t("download.start")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DownloadBar;
