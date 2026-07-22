// ValidatorMap: a client-only Leaflet world map plotting every visible
// validator by its parsed lat/lon. This component MUST NOT touch Leaflet,
// `window`, or `document` during SSR/prerender (node build): all Leaflet init
// is deferred into useEffect behind a useMounted() gate, and Leaflet itself is
// imported lazily inside that effect so the prerender (node) bundle never
// evaluates it. During SSR we render a matching-height .skeleton .map-wrap
// placeholder so layout is stable and hydration is clean.

import { useEffect, useRef, useState } from "react";
import { useMounted } from "../../hooks/useMounted";
import { useValidators } from "../../state/ValidatorsContext";
import { LAMPORTS_PER_SOL, type ValidatorRow } from "../../csv/parse";

// Hard cap on rendered markers. Leaflet keeps a DOM node per marker; well past a
// couple thousand this stalls the main thread. When over the cap we plot the
// highest-stake validators first (most meaningful), and surface a notice.
const MAX_MARKERS = 2000;

// Solana explorer address links, first-8-chars label.
const EXPLORER_ADDR = "https://explorer.solana.com/address/";

interface PlottedRow {
  row: ValidatorRow;
  lat: number;
  lon: number;
  stakeSol: number;
}

// Parse the "Loc" field ("lat lon", space-separated) into finite coordinates.
// Returns null for missing/invalid/out-of-range values.
function parseLoc(loc: string): { lat: number; lon: number } | null {
  if (!loc) return null;
  const parts = loc.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  // Drop the degenerate 0,0 "null island" that geo lookups fall back to.
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

function stakeSol(row: ValidatorRow): number {
  const raw = Number(row.ActivatedStake);
  return Number.isFinite(raw) ? raw / LAMPORTS_PER_SOL : 0;
}

// Compact SOL formatting for popups (e.g. 1.23M, 45.6K).
function fmtSol(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

// HTML-escape any user-controlled string before injecting into popup markup.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Normalize/validate an external URL for safe use in href (http/https only).
function safeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function addrLink(pubkey: string, label: string): string {
  const k = pubkey.trim();
  if (!k) return "";
  const short = `${esc(k.slice(0, 8))}…`;
  return `<div class="map-popup__row"><span class="map-popup__key">${label}</span><a class="map-popup__mono" href="${EXPLORER_ADDR}${encodeURIComponent(
    k,
  )}" target="_blank" rel="noopener noreferrer">${short}</a></div>`;
}

// Build the popup HTML for a single validator.
function popupHtml(p: PlottedRow): string {
  const r = p.row;
  const name = esc(r.Name || r.NodePubkey.slice(0, 12) || "Unknown validator");
  const isJito = r.IsJito === "true";

  const parts: string[] = [];
  parts.push(
    `<div class="map-popup"><b style="font-size:14px;display:block;margin-bottom:6px">${name}</b>`,
  );

  if (r.Details && r.Details.trim()) {
    parts.push(
      `<div style="color:var(--text-secondary);margin-bottom:8px">${esc(
        r.Details.trim(),
      )}</div>`,
    );
  }

  // External links (Website / Keybase).
  const links: string[] = [];
  const web = safeUrl(r.Website);
  if (web) {
    links.push(
      `<a href="${web}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe"></i> Website</a>`,
    );
  }
  if (r.KeybaseUsername && r.KeybaseUsername.trim()) {
    const kb = `https://keybase.io/${encodeURIComponent(
      r.KeybaseUsername.trim(),
    )}`;
    links.push(
      `<a href="${kb}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-key"></i> Keybase</a>`,
    );
  }
  if (links.length) {
    parts.push(
      `<div style="display:flex;gap:14px;margin-bottom:8px">${links.join(
        "",
      )}</div>`,
    );
  }

  // On-chain identity links.
  parts.push(addrLink(r.NodePubkey, "Node"));
  parts.push(addrLink(r.VotePubkey, "Vote"));
  parts.push(addrLink(r.ProgramAccount, "Program"));

  // Location / provider.
  const loc = [r.City, r.Region].filter((x) => x && x.trim()).join(", ");
  if (loc) {
    parts.push(
      `<div class="map-popup__row"><span class="map-popup__key">Location</span><span>${esc(
        loc,
      )}</span></div>`,
    );
  }
  if (r.Hosting && r.Hosting.trim()) {
    parts.push(
      `<div class="map-popup__row"><span class="map-popup__key">Hosting</span><span>${esc(
        r.Hosting.trim(),
      )}</span></div>`,
    );
  }

  // Metadata.
  if (r.ValidatorVersion && r.ValidatorVersion.trim()) {
    parts.push(
      `<div class="map-popup__row"><span class="map-popup__key">Version</span><span class="map-popup__mono">${esc(
        r.ValidatorVersion.trim(),
      )}</span></div>`,
    );
  }
  parts.push(
    `<div class="map-popup__row"><span class="map-popup__key">Jito</span><span class="map-popup__mono">${
      isJito ? "Yes" : "No"
    }</span></div>`,
  );
  parts.push(
    `<div class="map-popup__row"><span class="map-popup__key">Stake</span><span class="map-popup__mono">${fmtSol(
      p.stakeSol,
    )} SOL</span></div>`,
  );

  parts.push("</div>");
  return parts.join("");
}

export function ValidatorMap() {
  const mounted = useMounted();
  const { visible, loading } = useValidators();

  // The div Leaflet mounts into, and the live map instance for cleanup/updates.
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Using `unknown`-ish typing here would fight the lazy import; keep it loose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  // Flips true once the async map/layer creation has finished. The marker-draw
  // effect keys on this so it never races ahead of an unset layerRef (which
  // previously left the map with zero markers).
  const [mapReady, setMapReady] = useState(false);

  // 1) Create the Leaflet map exactly once, on the client, after mount.
  useEffect(() => {
    // Belt-and-suspenders SSR guard: never touch Leaflet/DOM on the server.
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      // Lazy import so the prerender (node) bundle never evaluates Leaflet.
      const L = (await import("leaflet")).default ?? (await import("leaflet"));
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [25, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 12,
        worldCopyJump: true,
        preferCanvas: true,
        attributionControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      ).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      if (!cancelled) setMapReady(true);

      const attribution = document.querySelector(
        ".leaflet-control-attribution.leaflet-control",
      );
      if (attribution instanceof HTMLElement) {
        attribution.style.display = "none";
      }
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, [mounted]);

  // 2) (Re)draw markers whenever the visible set changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default ?? (await import("leaflet"));
      // Wait for the map/layer created by the first effect to exist.
      const map = mapRef.current;
      const layer = layerRef.current;
      if (cancelled || !map || !layer) return;

      layer.clearLayers();

      // Parse + rank rows by stake so a capped view keeps the biggest players.
      const plotted: PlottedRow[] = [];
      for (const row of visible) {
        const coord = parseLoc(row.Loc);
        if (!coord) continue;
        plotted.push({
          row,
          lat: coord.lat,
          lon: coord.lon,
          stakeSol: stakeSol(row),
        });
      }
      plotted.sort((a, b) => b.stakeSol - a.stakeSol);

      const capped = plotted.length > MAX_MARKERS;
      const toPlot = capped ? plotted.slice(0, MAX_MARKERS) : plotted;

      // Small circle markers scale with stake; cheap and legible on dark tiles.
      const maxStake = toPlot.length ? toPlot[0].stakeSol : 0;
      for (const p of toPlot) {
        const t = maxStake > 0 ? p.stakeSol / maxStake : 0;
        const radius = 3 + Math.sqrt(t) * 7; // 3px..10px
        const marker = L.circleMarker([p.lat, p.lon], {
          radius,
          color: p.row.IsJito === "true" ? "#14F195" : "#9945FF",
          weight: 1,
          opacity: 0.9,
          fillColor: p.row.IsJito === "true" ? "#14F195" : "#9945FF",
          fillOpacity: 0.35,
        });
        marker.bindPopup(popupHtml(p), {
          maxWidth: 300,
          className: "map-popup-wrap",
        });
        marker.addTo(layer);
      }

      // Fit to the plotted extent (guard against empty/degenerate bounds).
      if (toPlot.length) {
        const bounds = L.latLngBounds(
          toPlot.map((p) => [p.lat, p.lon] as [number, number]),
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
        }
      }

      // Show/refresh a perf-cap notice as a Leaflet control.
      if (map.__capNotice) {
        map.removeControl(map.__capNotice);
        map.__capNotice = null;
      }
      if (capped) {
        const NoticeControl = L.Control.extend({
          onAdd() {
            const div = L.DomUtil.create(
              "div",
              "leaflet-control map-cap-notice",
            );
            div.style.cssText =
              "background:rgba(14,16,20,.9);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.7);padding:6px 10px;border-radius:8px;font-size:11px;font-family:var(--font-display);text-transform:uppercase;letter-spacing:.04em";
            div.innerHTML = `Showing top ${MAX_MARKERS.toLocaleString()} of ${plotted.length.toLocaleString()} by stake`;
            return div;
          },
        });
        const notice = new NoticeControl({ position: "bottomleft" });
        notice.addTo(map);
        map.__capNotice = notice;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, mapReady]);

  // SSR / pre-mount: render a matching-height skeleton so layout stays stable
  // and prerender never reaches Leaflet. Leaflet init only runs post-mount.
  if (!mounted) {
    return (
      <div className="glass map-wrap" aria-hidden="true">
        <div className="skeleton map-wrap__canvas" />
      </div>
    );
  }

  return (
    <div className="glass map-wrap">
      <div
        ref={containerRef}
        className="map-wrap__canvas"
        role="region"
        aria-label="World map of Solana validators"
      />
      {loading && visible.length === 0 ? (
        <div
          className="skeleton map-wrap__canvas"
          style={{ position: "absolute", inset: "var(--sp-8)" }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

export default ValidatorMap;
