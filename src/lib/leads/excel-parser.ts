import * as XLSX from "xlsx";

export type ParsedLeadRow = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  score?: number;
  notes?: string;
  // New importable columns
  status?: string;        // "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED"
  createdAt?: Date;       // custom creation date override
  source?: string;        // "website" | "referral" | "social" | "manual" | "import" | "quiz" | "cold_call"
  assignedTo?: string;    // email or "First Last" — resolved to userId in server action
  campaignName?: string;  // stored in Lead.campaignName
};

export type ParseResult = {
  valid: ParsedLeadRow[];
  errors: string[];
  total: number;
};

const MAX_ROWS = 500;

/** Map of accepted column header aliases → internal field name */
const COLUMN_MAP: Record<string, keyof ParsedLeadRow> = {
  // First Name
  "first name": "firstName",
  "first name *": "firstName",
  firstname: "firstName",

  // Last Name
  "last name": "lastName",
  lastname: "lastName",

  // Email
  email: "email",
  "email address": "email",

  // Phone
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",

  // Company
  company: "companyName",
  "company name": "companyName",
  organization: "companyName",

  // Score
  score: "score",
  "score (0-100)": "score",

  // Notes
  notes: "notes",
  note: "notes",
  comments: "notes",

  // Status
  status: "status",
  "lead status": "status",

  // Created At
  "created at": "createdAt",
  "creation date": "createdAt",
  "created date": "createdAt",
  created: "createdAt",
  date: "createdAt",

  // Source
  source: "source",
  "lead source": "source",
  origin: "source",

  // Assigned To
  "assigned to": "assignedTo",
  assignee: "assignedTo",
  owner: "assignedTo",
  "sales rep": "assignedTo",

  // Campaign Name
  campaign: "campaignName",
  "campaign name": "campaignName",
  "utm campaign": "campaignName",
};

/** Normalize status input to DB enum value */
const STATUS_MAP: Record<string, string> = {
  new: "NEW",
  contacted: "CONTACTED",
  qualified: "QUALIFIED",
  unqualified: "UNQUALIFIED",
  converted: "CONVERTED",
};

/** Normalize source input to stored string */
const SOURCE_MAP: Record<string, string> = {
  website: "website",
  web: "website",
  online: "website",
  referral: "referral",
  referred: "referral",
  social: "social",
  "social media": "social",
  manual: "manual",
  import: "import",
  quiz: "quiz",
  "cold call": "cold_call",
  cold_call: "cold_call",
  coldcall: "cold_call",
  phone: "cold_call",
};

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase();
}

function cellToString(cell: unknown): string {
  if (cell == null) return "";
  return String(cell).trim();
}

/**
 * Parse an Excel or CSV file (as ArrayBuffer) into an array of lead rows.
 * Runs entirely in the browser — no server call needed.
 */
export function parseLeadFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { valid: [], errors: ["The file appears to be empty."], total: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  // header: 1 → returns array of arrays; first row = headers
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  if (rows.length < 2) {
    return {
      valid: [],
      errors: ["The file has no data rows (only a header row was found)."],
      total: 0,
    };
  }

  // Build header → field mapping from the first row
  const headerRow = rows[0] as unknown[];
  const fieldMap: (keyof ParsedLeadRow | null)[] = headerRow.map((h) => {
    const key = normalizeHeader(h);
    return COLUMN_MAP[key] ?? null;
  });

  const hasFirstName = fieldMap.includes("firstName");
  if (!hasFirstName) {
    return {
      valid: [],
      errors: [
        'Column "First Name" is required but was not found in the file. Please use the template.',
      ],
      total: 0,
    };
  }

  const dataRows = rows.slice(1);
  const total = dataRows.length;

  if (total > MAX_ROWS) {
    return {
      valid: [],
      errors: [`The file contains ${total} rows. Maximum allowed is ${MAX_ROWS} rows per import.`],
      total,
    };
  }

  const valid: ParsedLeadRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const rowArr = row as unknown[];
    const rowNum = idx + 2; // 1-based row number including header

    // Check if row is entirely empty
    const isEmptyRow = rowArr.every((cell) => cellToString(cell) === "");
    if (isEmptyRow) return; // skip silently

    // Build lead object from columns
    const lead: Partial<ParsedLeadRow> = {};
    fieldMap.forEach((field, colIdx) => {
      if (!field) return;
      const rawValue = rowArr[colIdx];
      const raw = cellToString(rawValue);
      if (!raw) return;

      if (field === "score") {
        const n = Number(raw);
        if (!isNaN(n) && n >= 0 && n <= 100) {
          lead.score = Math.round(n);
        }
        // invalid score → just omit it
      } else if (field === "status") {
        const normalized = STATUS_MAP[raw.toLowerCase()];
        if (normalized) lead.status = normalized;
        // unrecognized status → omit (server will default to NEW)
      } else if (field === "source") {
        const normalized = SOURCE_MAP[raw.toLowerCase()];
        if (normalized) lead.source = normalized;
        // unrecognized source → omit (server will default to "import")
      } else if (field === "createdAt") {
        let d: Date | undefined;
        if (rawValue instanceof Date) {
          d = rawValue;
        } else {
          const parsed = new Date(raw);
          if (!isNaN(parsed.getTime())) d = parsed;
        }
        if (d) lead.createdAt = d;
      } else {
        (lead as Record<string, string>)[field] = raw;
      }
    });

    if (!lead.firstName) {
      errors.push(`Row ${rowNum}: "First Name" is required but was empty — row skipped.`);
      return;
    }

    // Basic email format check
    if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      errors.push(
        `Row ${rowNum}: "${lead.email}" is not a valid email — email field cleared.`
      );
      delete lead.email;
    }

    valid.push(lead as ParsedLeadRow);
  });

  return { valid, errors, total };
}

/** Generate and trigger download of the import template .xlsx file */
export function downloadLeadTemplate(): void {
  const headers = [
    "First Name *",
    "Last Name",
    "Email",
    "Phone",
    "Company",
    "Score (0-100)",
    "Notes",
    "Status",
    "Created At",
    "Source",
    "Assigned To",
    "Campaign Name",
  ];
  const example = [
    "John",
    "Smith",
    "john@acme.com",
    "+1234567890",
    "Acme Inc",
    "75",
    "Met at conference",
    "New",
    "2024-01-15",
    "Website",
    "rep@company.com",
    "Summer 2024",
  ];
  const statusNote = [
    "Status options: New / Contacted / Qualified / Unqualified / Converted",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Source options: Website / Referral / Social / Manual / Import / Quiz / Cold Call",
    "Assigned To: user email (preferred) or Full Name",
    "",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example, statusNote]);

  ws["!cols"] = headers.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, "leads-import-template.xlsx");
}
