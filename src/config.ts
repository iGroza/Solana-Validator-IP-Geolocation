// Application configuration for the Solana Validator Geo web app.
// NOTE: The Deno data-pipeline config lives in ./pipeline/config.ts.

export const APP_NAME = "Solana Validator Geo";
export const SITE_URL = "https://sol.igroza.su";
export const BASE_PATH = "/";
export const REPO = "iGroza/Solana-Validator-IP-Geolocation";
export const GITHUB_URL = "https://github.com/iGroza/Solana-Validator-IP-Geolocation";

// Primary live data source (raw CSV on the default branch).
export const RAW_CSV_URL =
  "https://raw.githubusercontent.com/iGroza/Solana-Validator-IP-Geolocation/main/solana_validators.csv";

// Fallback CSV shipped alongside the built site. Relative so it resolves under BASE_PATH.
export const LOCAL_CSV_URL = "solana_validators.csv";

// Last-update timestamp JSON: { timestamp: string }.
export const LAST_UPDATE_URL =
  "https://raw.githubusercontent.com/iGroza/Solana-Validator-IP-Geolocation/main/last_update.json";

// Earliest release date we consider valid history.
export const DATA_START_DATE = "2025-03-27";
