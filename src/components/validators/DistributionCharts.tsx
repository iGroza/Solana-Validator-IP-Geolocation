// DistributionCharts: recharts-powered breakdowns of the visible validator set.
// Solana palette (purple -> green gradient + cyan/teal accents), dark styled
// tooltips/legends, and ResponsiveContainer for fluid sizing. All charts are
// CLIENT-ONLY via useMounted() with matching-height skeletons for SSR safety.

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useValidators } from "../../state/ValidatorsContext";
import {
  countBy,
  jitoDistribution,
  stakeBySol,
  topN,
  versionDistribution,
} from "../../csv/stats";
import { useMounted } from "../../hooks/useMounted";

/* ─────────────────────────── Solana palette ─────────────────────────── */

const SOL_PURPLE = "#9945FF";
const SOL_GREEN = "#14F195";
const SOL_CYAN = "#19FB9B";
const SOL_BLUE = "#00C2FF";

// Discrete series colors interpolated across the purple -> green ramp,
// with cyan/teal accents mixed in for categorical charts (versions, pie).
const SERIES_COLORS = [
  SOL_PURPLE,
  "#7B4BFF",
  "#5A63FF",
  SOL_BLUE,
  "#12CFC6",
  SOL_CYAN,
  SOL_GREEN,
  "#8AF0A8",
  "#B57BFF",
  "#3FA9FF",
];

const CHART_HEIGHT = 300;
const AXIS_COLOR = "rgba(255,255,255,.5)";
const GRID_COLOR = "rgba(255,255,255,.06)";

/* ───────────────────────────── formatters ───────────────────────────── */

function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString("en-US");
}

function formatSol(n: number): string {
  return `${formatCompact(n)} SOL`;
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/* ───────────────────────── dark tooltip / legend ────────────────────── */

interface TooltipPayloadEntry {
  name?: string | number;
  value?: number | string;
  payload?: { name?: string };
  color?: string;
}

function makeTooltip(unit: "count" | "sol") {
  return function DarkTooltip({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string | number;
  }) {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0];
    const name =
      (label as string) ?? entry.payload?.name ?? String(entry.name ?? "");
    const raw = Number(entry.value ?? 0);
    const valueText = unit === "sol" ? formatSol(raw) : formatInt(raw);
    return (
      <div
        style={{
          background: "rgba(14,16,20,.92)",
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: 10,
          padding: "8px 12px",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 30px rgba(0,0,0,.5)",
          fontSize: 13,
          lineHeight: 1.4,
          maxWidth: 260,
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,.7)",
            fontSize: 11,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            marginBottom: 4,
            wordBreak: "break-word",
          }}
        >
          {name}
        </div>
        <div style={{ color: "#fff", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {valueText}
        </div>
      </div>
    );
  };
}

const legendStyle: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,.7)",
};

function renderLegend(value: string): ReactNode {
  return <span style={{ color: "rgba(255,255,255,.7)" }}>{value}</span>;
}

/* ─────────────────────────── chart card shell ───────────────────────── */

interface Datum {
  name: string;
  value: number;
}

function ChartCard({
  title,
  icon,
  unit,
  children,
}: {
  title: string;
  icon: string;
  unit: "count" | "sol";
  children: ReactNode;
}) {
  return (
    <div className="chart-card glass card">
      <div className="chart-card__title">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
        <span>{title}</span>
        <span className="chart-card__unit">
          {unit === "sol" ? "SOL" : "Count"}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────────── bar chart ────────────────────────────── */

function gradientId(key: string): string {
  return `sol-bar-${key}`;
}

function HorizontalBar({
  data,
  unit,
  colorKey,
}: {
  data: Datum[];
  unit: "count" | "sol";
  colorKey: string;
}) {
  const Tip = useMemo(() => makeTooltip(unit), [unit]);
  const gid = gradientId(colorKey);
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={SOL_PURPLE} />
            <stop offset="55%" stopColor={SOL_BLUE} />
            <stop offset="100%" stopColor={SOL_GREEN} />
          </linearGradient>
        </defs>
        <XAxis
          type="number"
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          tickFormatter={(v: number) => formatCompact(v)}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={{ stroke: GRID_COLOR }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          interval={0}
          tickFormatter={(v: string) =>
            v.length > 16 ? `${v.slice(0, 15)}…` : v
          }
        />
        <Tooltip
          content={<Tip />}
          cursor={{ fill: "rgba(255,255,255,.04)" }}
        />
        <Bar
          dataKey="value"
          fill={`url(#${gid})`}
          radius={[0, 4, 4, 0]}
          maxBarSize={26}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ───────────────────────────── donut chart ──────────────────────────── */

function Donut({
  data,
  unit,
  colors = SERIES_COLORS,
}: {
  data: Datum[];
  unit: "count" | "sol";
  colors?: string[];
}) {
  const Tip = useMemo(() => makeTooltip(unit), [unit]);
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          stroke="rgba(14,16,20,.9)"
          strokeWidth={2}
          isAnimationActive
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={legendStyle}
          formatter={renderLegend}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ──────────────────────────── skeletons ─────────────────────────────── */

const CHART_TITLES: { title: string; icon: string; unit: "count" | "sol" }[] = [
  { title: "Validator Versions", icon: "fa-code-branch", unit: "count" },
  { title: "Jito vs Non-Jito", icon: "fa-bolt", unit: "count" },
  { title: "Top 10 Countries by Count", icon: "fa-flag", unit: "count" },
  { title: "Top 10 Countries by Stake", icon: "fa-earth-americas", unit: "sol" },
  { title: "Top 10 Hosting by Count", icon: "fa-server", unit: "count" },
  { title: "Top 10 Hosting by Stake", icon: "fa-network-wired", unit: "sol" },
  { title: "Top 10 Cities by Stake", icon: "fa-city", unit: "sol" },
  { title: "Top 10 Regions by Stake", icon: "fa-map-location-dot", unit: "sol" },
];

function ChartsSkeleton() {
  // Skeleton height matches title block (~55px) + chart body (CHART_HEIGHT).
  const cardHeight = CHART_HEIGHT + 96;
  return (
    <div className="chart-grid" aria-hidden="true">
      {CHART_TITLES.map((c) => (
        <div
          key={c.title}
          className="chart-card skeleton"
          style={{ height: cardHeight }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────── component ────────────────────────────── */

export function DistributionCharts() {
  const { visible } = useValidators();
  const mounted = useMounted();

  const data = useMemo(() => {
    if (!mounted) return null;
    return {
      versions: topN(versionDistribution(visible), 8),
      jito: jitoDistribution(visible),
      countriesByCount: topN(countBy(visible, "Country"), 10),
      countriesByStake: topN(stakeBySol(visible, "Country"), 10),
      hostingByCount: topN(countBy(visible, "Hosting"), 10),
      hostingByStake: topN(stakeBySol(visible, "Hosting"), 10),
      citiesByStake: topN(stakeBySol(visible, "City"), 10),
      regionsByStake: topN(stakeBySol(visible, "Region"), 10),
    };
  }, [mounted, visible]);

  if (!mounted || !data) {
    return <ChartsSkeleton />;
  }

  return (
    <div className="chart-grid">
      <ChartCard title="Validator Versions" icon="fa-code-branch" unit="count">
        <Donut data={data.versions} unit="count" />
      </ChartCard>

      <ChartCard title="Jito vs Non-Jito" icon="fa-bolt" unit="count">
        <Donut
          data={data.jito}
          unit="count"
          colors={[SOL_GREEN, SOL_PURPLE]}
        />
      </ChartCard>

      <ChartCard title="Top 10 Countries by Count" icon="fa-flag" unit="count">
        <HorizontalBar
          data={data.countriesByCount}
          unit="count"
          colorKey="country-count"
        />
      </ChartCard>

      <ChartCard
        title="Top 10 Countries by Stake"
        icon="fa-earth-americas"
        unit="sol"
      >
        <HorizontalBar
          data={data.countriesByStake}
          unit="sol"
          colorKey="country-stake"
        />
      </ChartCard>

      <ChartCard title="Top 10 Hosting by Count" icon="fa-server" unit="count">
        <HorizontalBar
          data={data.hostingByCount}
          unit="count"
          colorKey="hosting-count"
        />
      </ChartCard>

      <ChartCard
        title="Top 10 Hosting by Stake"
        icon="fa-network-wired"
        unit="sol"
      >
        <HorizontalBar
          data={data.hostingByStake}
          unit="sol"
          colorKey="hosting-stake"
        />
      </ChartCard>

      <ChartCard title="Top 10 Cities by Stake" icon="fa-city" unit="sol">
        <HorizontalBar
          data={data.citiesByStake}
          unit="sol"
          colorKey="city-stake"
        />
      </ChartCard>

      <ChartCard
        title="Top 10 Regions by Stake"
        icon="fa-map-location-dot"
        unit="sol"
      >
        <HorizontalBar
          data={data.regionsByStake}
          unit="sol"
          colorKey="region-stake"
        />
      </ChartCard>
    </div>
  );
}

export default DistributionCharts;
