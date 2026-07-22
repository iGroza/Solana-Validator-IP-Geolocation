// Insights: narrative, computed observations about the visible validator set.
// Each card renders a FontAwesome icon + title + descriptive sentence produced
// by computeInsights(). Client-only via useMounted() with matching-height
// skeletons for SSR safety.

import { useValidators } from "../../state/ValidatorsContext";
import { computeInsights, type Insight } from "../../csv/stats";
import { useMounted } from "../../hooks/useMounted";
import { useI18n, type Locale } from "../../i18n";

const SKELETON_COUNT = 6;

function InsightCard({
  insight,
  locale,
}: {
  insight: Insight;
  locale: Locale;
}) {
  const text = insight[locale] ?? insight.en;
  return (
    <article className="insight-card glass card">
      <div className="insight-card__icon" aria-hidden="true">
        <i className={`fa-solid ${insight.icon}`} />
      </div>
      <p>{text}</p>
    </article>
  );
}

export function Insights() {
  const { visible } = useValidators();
  const { locale } = useI18n();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="insight-grid" aria-hidden="true">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="insight-card skeleton"
            style={{ height: 190 }}
          />
        ))}
      </div>
    );
  }

  const insights = computeInsights(visible);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="insight-grid">
      {insights.map((insight, i) => (
        <InsightCard key={`${insight.icon}-${i}`} insight={insight} locale={locale} />
      ))}
    </div>
  );
}

export default Insights;
