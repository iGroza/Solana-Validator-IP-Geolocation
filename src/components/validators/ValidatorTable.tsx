// Searchable, sortable, paginated table over the currently visible validator
// rows. Renders a sticky header, formatted SOL stake, and a debounced text
// search that filters across all displayed fields.

import { useEffect, useMemo, useState } from "react";
import { useValidators } from "../../state/ValidatorsContext";
import { LAMPORTS_PER_SOL, type ValidatorRow } from "../../csv/parse";
import { useI18n } from "../../i18n";

const PAGE_SIZE = 50;

type ColumnKey =
  | "Name"
  | "City"
  | "Country"
  | "Hosting"
  | "ValidatorVersion"
  | "IsJito"
  | "StakeSol"
  | "Commission"
  | "IP";

interface ColumnDef {
  key: ColumnKey;
  /** i18n key for the header label. */
  labelKey: string;
  numeric?: boolean;
  mono?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "Name", labelKey: "table.col.name" },
  { key: "City", labelKey: "table.col.city" },
  { key: "Country", labelKey: "table.col.country" },
  { key: "Hosting", labelKey: "table.col.hosting" },
  { key: "ValidatorVersion", labelKey: "table.col.version", mono: true },
  { key: "IsJito", labelKey: "table.col.jito" },
  { key: "StakeSol", labelKey: "table.col.stake", numeric: true },
  { key: "Commission", labelKey: "table.col.commission", numeric: true },
  { key: "IP", labelKey: "table.col.ip", mono: true },
];

const solFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** Stake in SOL from the raw lamport string. */
function stakeSol(row: ValidatorRow): number {
  const lamports = Number(row.ActivatedStake);
  return Number.isFinite(lamports) ? lamports / LAMPORTS_PER_SOL : 0;
}

/** Numeric commission, tolerating blank/garbage values. */
function commissionNum(row: ValidatorRow): number {
  const n = Number(row.Commission);
  return Number.isFinite(n) ? n : 0;
}

/** Value used for sorting a given column. */
function sortValue(row: ValidatorRow, key: ColumnKey): string | number {
  switch (key) {
    case "StakeSol":
      return stakeSol(row);
    case "Commission":
      return commissionNum(row);
    case "IsJito":
      return row.IsJito === "true" ? 1 : 0;
    default:
      return (row[key] ?? "").toLowerCase();
  }
}

/** Concatenated searchable haystack for a row (built once per filter pass). */
function haystack(row: ValidatorRow): string {
  return [
    row.Name,
    row.City,
    row.Region,
    row.Country,
    row.Hosting,
    row.ValidatorVersion,
    row.IP,
    row.NodePubkey,
    row.VotePubkey,
    row.IsJito === "true" ? "jito" : "",
  ]
    .join(" ")
    .toLowerCase();
}

export function ValidatorTable() {
  const { visible } = useValidators();
  const { t } = useI18n();

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ColumnKey>("StakeSol");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Debounce the search input so filtering does not run on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQuery(rawQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const filtered = useMemo(() => {
    if (!query) return visible;
    return visible.filter((row) => haystack(row).includes(query));
  }, [visible, query]);

  const sorted = useMemo(() => {
    const copy = filtered.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  // Keep the current page in range whenever the result set shrinks
  // (search/filter/Jito-only changes). Prevents a "stuck on empty page" bug.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Reset to the first page whenever the filter query changes.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(start, start + PAGE_SIZE);

  const handleSort = (key: ColumnKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Sensible default direction: text asc, numbers desc.
      const col = COLUMNS.find((c) => c.key === key);
      setSortDir(col?.numeric || key === "IsJito" ? "desc" : "asc");
    }
    setPage(1);
  };

  const rangeStart = sorted.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + PAGE_SIZE, sorted.length);

  return (
    <div>
      <div className="toolbar">
        <label className="search-input">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="search"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder={t("table.search")}
            aria-label={t("table.search")}
          />
        </label>
        <span className="badge badge-mono">
          {sorted.length.toLocaleString()} {t("stat.validators")}
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    aria-sort={
                      active
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    scope="col"
                  >
                    {t(col.labelKey)}
                    {active && (
                      <span className="sort-ind" aria-hidden="true">
                        <i
                          className={`fa-solid fa-caret-${
                            sortDir === "asc" ? "up" : "down"
                          }`}
                        />
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ textAlign: "center" }}>
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={`${row.NodePubkey || row.IP}-${start + i}`}>
                  <td>{row.Name || "—"}</td>
                  <td>{row.City || "—"}</td>
                  <td>{row.Country || "—"}</td>
                  <td>{row.Hosting || "—"}</td>
                  <td className="mono">{row.ValidatorVersion || "—"}</td>
                  <td>
                    {row.IsJito === "true" ? (
                      <span className="badge badge--accent">{t("table.yes")}</span>
                    ) : (
                      <span className="cell-muted">{t("table.no")}</span>
                    )}
                  </td>
                  <td className="cell-num">{solFormatter.format(stakeSol(row))}</td>
                  <td className="cell-num">
                    {row.Commission ? `${commissionNum(row)}%` : "—"}
                  </td>
                  <td className="mono">{row.IP || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pager">
        <span>
          {t("table.showing")
            .replace(
              "{shown}",
              `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()}`
            )
            .replace("{total}", sorted.length.toLocaleString())}
        </span>
        <div className="table-pager__controls">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            Prev
          </button>
          <span>
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
          >
            Next
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ValidatorTable;
