// Pure aggregation + narrative-insight helpers over parsed validator rows.

import { LAMPORTS_PER_SOL, type ValidatorRow } from "./parse";

export interface Totals {
  totalStakeSol: number;
  totalValidators: number;
  uniqueCities: number;
  uniqueRegions: number;
  uniqueHosting: number;
  uniqueCountries: number;
  jitoCount: number;
  jitoStakeSol: number;
  jitoStakePct: number;
}

function stakeLamports(row: ValidatorRow): number {
  const v = Number(row.ActivatedStake);
  return Number.isFinite(v) ? v : 0;
}

function isJito(row: ValidatorRow): boolean {
  return row.IsJito === "true";
}

function nonEmpty(value: string): string {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : "";
}

export function computeTotals(rows: ValidatorRow[]): Totals {
  const cities = new Set<string>();
  const regions = new Set<string>();
  const hosting = new Set<string>();
  const countries = new Set<string>();

  let totalStakeLamports = 0;
  let jitoCount = 0;
  let jitoStakeLamports = 0;

  for (const row of rows) {
    const s = stakeLamports(row);
    totalStakeLamports += s;

    if (nonEmpty(row.City)) cities.add(row.City.trim());
    if (nonEmpty(row.Region)) regions.add(row.Region.trim());
    if (nonEmpty(row.Hosting)) hosting.add(row.Hosting.trim());
    if (nonEmpty(row.Country)) countries.add(row.Country.trim());

    if (isJito(row)) {
      jitoCount += 1;
      jitoStakeLamports += s;
    }
  }

  const totalStakeSol = totalStakeLamports / LAMPORTS_PER_SOL;
  const jitoStakeSol = jitoStakeLamports / LAMPORTS_PER_SOL;
  const jitoStakePct =
    totalStakeLamports > 0
      ? (jitoStakeLamports / totalStakeLamports) * 100
      : 0;

  return {
    totalStakeSol,
    totalValidators: rows.length,
    uniqueCities: cities.size,
    uniqueRegions: regions.size,
    uniqueHosting: hosting.size,
    uniqueCountries: countries.size,
    jitoCount,
    jitoStakeSol,
    jitoStakePct,
  };
}

/** Count of rows grouped by a column; empty values bucket into "Unknown". Desc. */
export function countBy(
  rows: ValidatorRow[],
  key: keyof ValidatorRow
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = nonEmpty(String(row[key] ?? ""));
    const name = raw || "Unknown";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return Array.from(map, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value
  );
}

/** Total stake (SOL) grouped by a column; empty values bucket into "Unknown". Desc. */
export function stakeBySol(
  rows: ValidatorRow[],
  key: keyof ValidatorRow
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = nonEmpty(String(row[key] ?? ""));
    const name = raw || "Unknown";
    map.set(name, (map.get(name) ?? 0) + stakeLamports(row));
  }
  return Array.from(map, ([name, value]) => ({
    name,
    value: value / LAMPORTS_PER_SOL,
  })).sort((a, b) => b.value - a.value);
}

export function topN<T>(list: T[], n: number): T[] {
  return list.slice(0, Math.max(0, n));
}

/** Validator version distribution; empty -> "unknown". Desc by count. */
export function versionDistribution(
  rows: ValidatorRow[]
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = nonEmpty(row.ValidatorVersion);
    const name = raw || "unknown";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return Array.from(map, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value
  );
}

export function jitoDistribution(
  rows: ValidatorRow[]
): { name: string; value: number }[] {
  let jito = 0;
  for (const row of rows) if (isJito(row)) jito += 1;
  return [
    { name: "Jito", value: jito },
    { name: "Non-Jito", value: rows.length - jito },
  ];
}

export interface Insight {
  icon: string;
  /** English narrative sentence. */
  en: string;
  /** Russian narrative sentence (natural translation, same real numbers). */
  ru: string;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function fmtIntRu(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

function fmtSol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M SOL`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K SOL`;
  return `${Math.round(n).toLocaleString("en-US")} SOL`;
}

function fmtSolRu(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} млн SOL`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} тыс. SOL`;
  return `${Math.round(n).toLocaleString("ru-RU")} SOL`;
}

/**
 * Build 5-7 narrative insights computed from real numbers in the dataset.
 * Reads naturally as English sentences.
 */
export function computeInsights(rows: ValidatorRow[]): Insight[] {
  const insights: Insight[] = [];
  if (rows.length === 0) return insights;

  const totals = computeTotals(rows);
  const totalStake = totals.totalStakeSol;

  // 1. Stake concentration of the single largest hosting provider.
  const hostingByStake = stakeBySol(rows, "Hosting").filter(
    (h) => h.name !== "Unknown"
  );
  if (hostingByStake.length > 0 && totalStake > 0) {
    const top = hostingByStake[0];
    const pct = (top.value / totalStake) * 100;
    insights.push({
      icon: "fa-server",
      en: `${top.name} hosts the largest share of stake, controlling ${fmtPct(
        pct
      )} of the network's total ${fmtSol(totalStake)} across its validators.`,
      ru: `${top.name} размещает наибольшую долю стейка, контролируя ${fmtPct(
        pct
      )} от общего объёма сети в ${fmtSolRu(
        totalStake
      )} на своих валидаторах.`,
    });
  }

  // 2. Single-provider centralization risk (top-3 hosting providers by stake).
  if (hostingByStake.length >= 3 && totalStake > 0) {
    const top3 = hostingByStake
      .slice(0, 3)
      .reduce((acc, h) => acc + h.value, 0);
    const pct = (top3 / totalStake) * 100;
    insights.push({
      icon: "fa-triangle-exclamation",
      en: `The three largest hosting providers together account for ${fmtPct(
        pct
      )} of all activated stake, a key concentration factor for network resilience.`,
      ru: `Три крупнейших хостинг-провайдера вместе держат ${fmtPct(
        pct
      )} всего активного стейка — ключевой фактор концентрации для устойчивости сети.`,
    });
  }

  // 3. Jito adoption: share of validators and share of stake.
  {
    const valPct =
      totals.totalValidators > 0
        ? (totals.jitoCount / totals.totalValidators) * 100
        : 0;
    insights.push({
      icon: "fa-bolt",
      en: `${fmtPct(valPct)} of validators (${fmtInt(
        totals.jitoCount
      )} of ${fmtInt(
        totals.totalValidators
      )}) run the Jito client, representing ${fmtPct(
        totals.jitoStakePct
      )} of all activated stake.`,
      ru: `${fmtPct(valPct)} валидаторов (${fmtIntRu(
        totals.jitoCount
      )} из ${fmtIntRu(
        totals.totalValidators
      )}) используют клиент Jito, что составляет ${fmtPct(
        totals.jitoStakePct
      )} всего активного стейка.`,
    });
  }

  // 4. Top country by stake.
  const countryByStake = stakeBySol(rows, "Country").filter(
    (c) => c.name !== "Unknown"
  );
  if (countryByStake.length > 0 && totalStake > 0) {
    const top = countryByStake[0];
    const pct = (top.value / totalStake) * 100;
    insights.push({
      icon: "fa-flag",
      en: `${top.name} leads all countries with ${fmtPct(
        pct
      )} of total stake (${fmtSol(top.value)}) delegated to validators located there.`,
      ru: `${top.name} лидирует среди всех стран: ${fmtPct(
        pct
      )} всего стейка (${fmtSolRu(
        top.value
      )}) делегировано валидаторам, расположенным там.`,
    });
  }

  // 5. Share of stake in the top-3 countries.
  if (countryByStake.length >= 3 && totalStake > 0) {
    const top3 = countryByStake
      .slice(0, 3)
      .reduce((acc, c) => acc + c.value, 0);
    const pct = (top3 / totalStake) * 100;
    const names = countryByStake
      .slice(0, 3)
      .map((c) => c.name)
      .join(", ");
    insights.push({
      icon: "fa-earth-americas",
      en: `The top three countries (${names}) hold a combined ${fmtPct(
        pct
      )} of all activated stake, highlighting where the network is most concentrated.`,
      ru: `Три ведущие страны (${names}) держат в сумме ${fmtPct(
        pct
      )} всего активного стейка, показывая, где сеть наиболее концентрирована.`,
    });
  }

  // 6. Geographic spread.
  insights.push({
    icon: "fa-globe",
    en: `Validators are distributed across ${fmtInt(
      totals.uniqueCountries
    )} countries and ${fmtInt(totals.uniqueCities)} cities, served by ${fmtInt(
      totals.uniqueHosting
    )} distinct hosting providers.`,
    ru: `Валидаторы распределены по ${fmtIntRu(
      totals.uniqueCountries
    )} странам и ${fmtIntRu(
      totals.uniqueCities
    )} городам и обслуживаются ${fmtIntRu(
      totals.uniqueHosting
    )} различными хостинг-провайдерами.`,
  });

  // 7. Average commission.
  {
    let sum = 0;
    let count = 0;
    for (const row of rows) {
      const c = Number(row.Commission);
      if (Number.isFinite(c)) {
        sum += c;
        count += 1;
      }
    }
    if (count > 0) {
      const avg = sum / count;
      insights.push({
        icon: "fa-percent",
        en: `The average validator commission is ${avg.toFixed(
          1
        )}%, based on ${fmtInt(count)} validators reporting a commission rate.`,
        ru: `Средняя комиссия валидатора составляет ${avg
          .toFixed(1)
          .replace(".", ",")}%, по данным ${fmtIntRu(
          count
        )} валидаторов, указавших ставку комиссии.`,
      });
    }
  }

  return insights;
}
