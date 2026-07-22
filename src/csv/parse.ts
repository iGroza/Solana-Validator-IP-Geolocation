// RFC-4180-ish CSV parsing tailored for the solana_validators.csv dataset.
// Handles: quoted fields containing commas/newlines, doubled-quote escaping ("")
// inside quoted fields, and unicode/emoji content. Maps the header row to keys.

export interface ValidatorRow {
  IP: string;
  City: string;
  Region: string;
  Country: string;
  Loc: string;
  Hosting: string;
  HostingCompanyId: string;
  Timezone: string;
  Name: string;
  Website: string;
  IconUrl: string;
  Details: string;
  KeybaseUsername: string;
  ActivatedStake: string;
  Commission: string;
  NodePubkey: string;
  VotePubkey: string;
  ProgramAccount: string;
  ValidatorVersion: string;
  IsJito: string;
}

export const LAMPORTS_PER_SOL = 1e9;

// Human-friendly labels for each machine column key.
export const COLUMN_LABELS: Record<string, string> = {
  IP: "IP Address",
  City: "City",
  Region: "Region",
  Country: "Country",
  Loc: "Coordinates",
  Hosting: "Hosting Provider",
  HostingCompanyId: "Hosting ASN",
  Timezone: "Timezone",
  Name: "Validator Name",
  Website: "Website",
  IconUrl: "Icon URL",
  Details: "Details",
  KeybaseUsername: "Keybase Username",
  ActivatedStake: "Activated Stake",
  Commission: "Commission",
  NodePubkey: "Node Pubkey",
  VotePubkey: "Vote Pubkey",
  ProgramAccount: "Program Account",
  ValidatorVersion: "Validator Version",
  IsJito: "Jito",
};

/**
 * Tokenize a single CSV text buffer into an array of records (each a string[]).
 * State machine that correctly handles quoted fields with embedded commas,
 * newlines, and doubled-quote ("") escapes.
 */
function tokenize(text: string): string[][] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  // Normalize away a leading BOM if present.
  if (text.charCodeAt(0) === 0xfeff) {
    i = 1;
  }

  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  while (i < n) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Doubled quote inside a quoted field -> literal quote.
        if (i + 1 < n && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        // Closing quote.
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }

    if (ch === "\r") {
      // Handle CRLF and lone CR as record terminators.
      if (i + 1 < n && text[i + 1] === "\n") {
        i += 1;
      }
      pushRecord();
      i += 1;
      continue;
    }

    if (ch === "\n") {
      pushRecord();
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Flush trailing field/record if the buffer did not end with a newline.
  if (field.length > 0 || record.length > 0) {
    pushRecord();
  }

  return records;
}

const HEADER_KEYS: (keyof ValidatorRow)[] = [
  "IP",
  "City",
  "Region",
  "Country",
  "Loc",
  "Hosting",
  "HostingCompanyId",
  "Timezone",
  "Name",
  "Website",
  "IconUrl",
  "Details",
  "KeybaseUsername",
  "ActivatedStake",
  "Commission",
  "NodePubkey",
  "VotePubkey",
  "ProgramAccount",
  "ValidatorVersion",
  "IsJito",
];

function emptyRow(): ValidatorRow {
  return {
    IP: "",
    City: "",
    Region: "",
    Country: "",
    Loc: "",
    Hosting: "",
    HostingCompanyId: "",
    Timezone: "",
    Name: "",
    Website: "",
    IconUrl: "",
    Details: "",
    KeybaseUsername: "",
    ActivatedStake: "",
    Commission: "",
    NodePubkey: "",
    VotePubkey: "",
    ProgramAccount: "",
    ValidatorVersion: "",
    IsJito: "",
  };
}

/**
 * Parse CSV text into typed ValidatorRow objects.
 * The header row determines key mapping; if headers are missing/unknown we fall
 * back to positional mapping against the canonical HEADER_KEYS order.
 */
export function parseCsv(text: string): ValidatorRow[] {
  if (!text) return [];

  const records = tokenize(text).filter(
    // Skip fully-empty lines (a single empty field or all-empty fields).
    (rec) => !(rec.length === 1 && rec[0].trim() === "")
  );

  if (records.length === 0) return [];

  const header = records[0].map((h) => h.trim());
  const headerMatchesKnown = header.some((h) =>
    (HEADER_KEYS as string[]).includes(h)
  );

  // Build the column-index -> key mapping.
  const keyByIndex: (keyof ValidatorRow | null)[] = [];
  if (headerMatchesKnown) {
    for (const h of header) {
      keyByIndex.push(
        (HEADER_KEYS as string[]).includes(h) ? (h as keyof ValidatorRow) : null
      );
    }
  } else {
    // No usable header row: treat every record as data, positional mapping.
    for (let idx = 0; idx < HEADER_KEYS.length; idx++) {
      keyByIndex.push(HEADER_KEYS[idx]);
    }
  }

  const dataRecords = headerMatchesKnown ? records.slice(1) : records;
  const rows: ValidatorRow[] = [];

  for (const rec of dataRecords) {
    if (rec.length === 1 && rec[0].trim() === "") continue;
    const row = emptyRow();
    const cols = headerMatchesKnown ? keyByIndex : HEADER_KEYS;
    for (let c = 0; c < rec.length; c++) {
      const key = cols[c] as keyof ValidatorRow | null | undefined;
      if (key) {
        row[key] = rec[c] ?? "";
      }
    }
    rows.push(row);
  }

  return rows;
}
