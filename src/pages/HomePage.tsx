// HomePage: the single-page composition for the Solana Validator Geo app.
//
// Section order (each with a stable id used by the Nav / scroll-spy and a
// [data-reveal] hook for scroll-in animation):
//   #overview  hero (AnimatedHeading title + lead + DownloadBar + live meta)
//   #stats     StatCards
//   #insights  Insights
//   #map       ValidatorMap
//   #replay    ReplayBar (interactive history replay)
//   #charts    DistributionCharts
//   #table     ValidatorTable
//
// Loading / error states are driven by useValidators(). A JsonLd WebApplication
// schema block is emitted for SEO (safe during SSR/prerender).

import {
  APP_NAME,
  GITHUB_URL,
  SITE_URL,
} from "../config";
import { AnimatedHeading } from "../components/common/AnimatedHeading";
import { JsonLd } from "../components/common/JsonLd";
import { SectionHeader } from "../components/common/SectionHeader";
import { DownloadBar } from "../components/validators/DownloadBar";
import { StatCards } from "../components/validators/StatCards";
import { Insights } from "../components/validators/Insights";
import { ValidatorMap } from "../components/validators/ValidatorMap";
import { DistributionCharts } from "../components/validators/DistributionCharts";
import { ValidatorTable } from "../components/validators/ValidatorTable";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { useValidators } from "../state/ValidatorsContext";
import { useI18n } from "../i18n";

// Schema.org WebApplication descriptor (rendered as a JSON-LD <script>).
const WEB_APPLICATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: APP_NAME,
  url: SITE_URL,
  applicationCategory: "DataVisualizationApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript.",
  description:
    "Interactive geolocation and infrastructure analytics for the Solana " +
    "validator set: stake distribution, hosting providers, Jito adoption, " +
    "client versions, and a live world map.",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  codeRepository: GITHUB_URL,
  license: GITHUB_URL,
} as const;

function humanTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function HomePage() {
  const { visible, loading, error, lastUpdate, reload, isReplay, replayDate } =
    useValidators();
  const { t } = useI18n();

  // Re-observe [data-reveal] nodes whenever data readiness changes so freshly
  // rendered sections animate in.
  useRevealOnScroll(loading || error ? "state" : `ready-${visible.length}`);

  const hasData = visible.length > 0;
  const showLoading = loading && !hasData;
  const showError = !loading && error !== null && !hasData;

  return (
    <>
      <JsonLd data={WEB_APPLICATION_SCHEMA} />

      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section id="overview" className="section hero">
        <div className="container">
          <div className="hero__inner">
            <span className="eyebrow hero__eyebrow" data-reveal>
              {t("hero.eyebrow")}
            </span>

            <AnimatedHeading
              as="h1"
              text={t("hero.title")}
              className="hero__title"
            />

            <p className="hero__sub" data-reveal data-reveal-delay="1">
              {t("hero.lead")}
            </p>

            <div data-reveal data-reveal-delay="2">
              <DownloadBar />
            </div>

            <div className="hero__meta" data-reveal data-reveal-delay="3">
              <span className="dot" aria-hidden="true" />
              <span>
                <b>{hasData ? visible.length.toLocaleString() : "—"}</b>{" "}
                {t("hero.meta.validators")}
              </span>
              <span>
                {isReplay ? (
                  <b>
                    {t("hero.meta.replaying").replace(
                      "{date}",
                      replayDate ?? ""
                    )}
                  </b>
                ) : (
                  <b>{t("hero.meta.live")}</b>
                )}
              </span>
              <span>
                {t("hero.meta.lastUpdate")}: <b>{humanTimestamp(lastUpdate)}</b>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── DATA STATES ────────────────────── */}
      {showLoading ? (
        <section className="section" aria-live="polite">
          <div className="container">
            <div className="state-block">
              <div className="spinner" aria-hidden="true" />
              <p>{t("state.loading")}</p>
            </div>
          </div>
        </section>
      ) : showError ? (
        <section className="section" aria-live="polite">
          <div className="container">
            <div className="state-block state-block--error">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              <p>{error}</p>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={reload}
              >
                <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                {t("state.retry")}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* ─────────────────────── STATS ─────────────────────── */}
          <section id="stats" className="section" data-reveal>
            <div className="container">
              <SectionHeader
                eyebrow={t("section.stats.eyebrow")}
                title={t("section.stats.title")}
                lead={t("section.stats.lead")}
              />
              <StatCards />
            </div>
          </section>

          {/* ────────────────────── INSIGHTS ───────────────────── */}
          <section id="insights" className="section" data-reveal>
            <div className="container">
              <SectionHeader
                eyebrow={t("section.insights.eyebrow")}
                title={t("section.insights.title")}
                lead={t("section.insights.lead")}
              />
              <Insights />
            </div>
          </section>

          {/* ──────────────────────── MAP ──────────────────────── */}
          <section id="map" className="section" data-reveal>
            <div className="container">
              <SectionHeader
                eyebrow={t("section.map.eyebrow")}
                title={t("section.map.title")}
                lead={t("section.map.lead")}
              />
              <ValidatorMap />
            </div>
          </section>

          {/* Replay is a fixed music-player-style bar rendered globally in App. */}

          {/* ─────────────────────── CHARTS ────────────────────── */}
          <section id="charts" className="section" data-reveal>
            <div className="container">
              <SectionHeader
                eyebrow={t("section.charts.eyebrow")}
                title={t("section.charts.title")}
                lead={t("section.charts.lead")}
              />
              <DistributionCharts />
            </div>
          </section>

          {/* ──────────────────────── TABLE ────────────────────── */}
          <section id="table" className="section" data-reveal>
            <div className="container">
              <SectionHeader
                eyebrow={t("section.table.eyebrow")}
                title={t("section.table.title")}
                lead={t("section.table.lead")}
              />
              <ValidatorTable />
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default HomePage;
