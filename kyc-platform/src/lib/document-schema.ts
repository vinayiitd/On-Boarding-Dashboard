/**
 * Field schemas for each recognised KYC document type.
 *
 * The verify-identity screen reads the schema and renders a bespoke form
 * per uploaded document. Field values are stored back on the document as
 * `verifiedData` so the Report and Officer views can display them later.
 */

import type { UploadedDocument } from "./types";

export type FieldType = "text" | "date" | "number" | "select" | "textarea";

export interface DocumentField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  /** Optional short helper text below the input. */
  hint?: string;
  /** Optional inputmode hint for numeric-only fields. */
  inputMode?: "numeric" | "decimal";
}

export interface DocumentSchema {
  /** Human-readable name shown above the form. */
  displayName: string;
  /** Short description of what this document proves. */
  purpose: string;
  /** Which finding section this document satisfies. Purely informational. */
  section: string;
  fields: DocumentField[];
  /** How to summarise a verified document once collapsed. */
  summary: (data: Record<string, string>) => string;
}

const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const COUNTRIES = [
  "Australia",
  "New Zealand",
  "United Kingdom",
  "United States",
  "Singapore",
  "Hong Kong",
  "United Arab Emirates",
  "Other",
];

const UTILITY_PROVIDERS = [
  "Origin Energy",
  "AGL",
  "EnergyAustralia",
  "Red Energy",
  "Sydney Water",
  "Yarra Valley Water",
  "Telstra",
  "Optus",
  "Other",
];

/* ---------------- Schema definitions ---------------- */

const PASSPORT: DocumentSchema = {
  displayName: "Passport",
  purpose: "Primary photo identity",
  section: "Identity",
  fields: [
    { key: "passportNumber", label: "Passport number", type: "text", required: true, placeholder: "PA1234567" },
    { key: "fullName", label: "Full name (as printed)", type: "text", required: true, placeholder: "Jane Amelia Smith" },
    { key: "countryOfIssue", label: "Country of issue", type: "select", options: COUNTRIES, required: true },
    { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
    { key: "expiryDate", label: "Expiry date", type: "date", required: true, hint: "Must be valid for at least 6 months" },
    { key: "sex", label: "Sex", type: "select", options: ["Female", "Male", "X", "Not specified"] },
  ],
  summary: (d) => `${d.fullName ?? "—"} · ${d.passportNumber ?? "—"}`,
};

const DRIVERS_LICENCE: DocumentSchema = {
  displayName: "Driver's licence",
  purpose: "Secondary photo identity",
  section: "Identity",
  fields: [
    { key: "licenceNumber", label: "Licence number", type: "text", required: true, placeholder: "12345678" },
    { key: "cardNumber", label: "Card number", type: "text", required: true, placeholder: "AB123456", hint: "The 8–10 character code on the back of the card" },
    { key: "fullName", label: "Full name", type: "text", required: true },
    { key: "stateOfIssue", label: "State of issue", type: "select", options: AUSTRALIAN_STATES, required: true },
    { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
    { key: "expiryDate", label: "Expiry date", type: "date", required: true },
  ],
  summary: (d) => `${d.fullName ?? "—"} · ${d.stateOfIssue ?? "—"} ${d.licenceNumber ?? ""}`.trim(),
};

const UTILITY_BILL: DocumentSchema = {
  displayName: "Utility bill",
  purpose: "Proof of residential address",
  section: "Address",
  fields: [
    { key: "provider", label: "Provider", type: "select", options: UTILITY_PROVIDERS, required: true },
    { key: "accountHolder", label: "Account holder", type: "text", required: true },
    { key: "address", label: "Full residential address", type: "textarea", required: true, placeholder: "12 Sample St, Suburb, State POSTCODE" },
    { key: "issueDate", label: "Issue date", type: "date", required: true, hint: "Bill must be less than 3 months old" },
    { key: "amountDue", label: "Amount due (AUD)", type: "number", inputMode: "decimal", placeholder: "e.g. 142.50" },
  ],
  summary: (d) => `${d.provider ?? "Utility"} · ${d.address?.split(",")[0] ?? "—"}`,
};

const ASIC_EXTRACT: DocumentSchema = {
  displayName: "ASIC extract",
  purpose: "Company registration",
  section: "Business",
  fields: [
    { key: "companyName", label: "Registered company name", type: "text", required: true },
    { key: "acn", label: "ACN", type: "text", required: true, inputMode: "numeric", placeholder: "9-digit ACN" },
    { key: "abn", label: "ABN", type: "text", inputMode: "numeric", placeholder: "11-digit ABN (if registered)" },
    { key: "registeredOffice", label: "Registered office", type: "textarea", required: true },
    { key: "registrationDate", label: "Registration date", type: "date" },
    { key: "directors", label: "Directors", type: "textarea", required: true, hint: "One per line, or comma-separated" },
  ],
  summary: (d) => `${d.companyName ?? "—"} · ACN ${d.acn ?? "—"}`,
};

const TRUST_DEED: DocumentSchema = {
  displayName: "Trust deed",
  purpose: "Trust structure & controllers",
  section: "Trust",
  fields: [
    { key: "trustName", label: "Trust name", type: "text", required: true },
    { key: "trustType", label: "Trust type", type: "select", options: ["Family / Discretionary", "Unit", "Fixed", "Testamentary", "Hybrid"], required: true },
    { key: "settlor", label: "Settlor", type: "text", required: true },
    { key: "trustee", label: "Trustee(s)", type: "textarea", required: true, hint: "Individuals or corporate trustees; one per line" },
    { key: "appointor", label: "Appointor / Principal", type: "text" },
    { key: "deedDate", label: "Date of deed", type: "date", required: true },
  ],
  summary: (d) => `${d.trustName ?? "—"} · ${d.trustType ?? ""}`.trim(),
};

const BENEFICIAL_OWNER: DocumentSchema = {
  displayName: "Beneficial owner declaration",
  purpose: "Owners with ≥ 25% control",
  section: "Ownership",
  fields: [
    { key: "fullName", label: "Full legal name", type: "text", required: true },
    { key: "ownershipPercent", label: "Ownership %", type: "number", required: true, inputMode: "decimal", placeholder: "e.g. 34" },
    { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
    { key: "country", label: "Country of residence", type: "select", options: COUNTRIES, required: true },
    { key: "pepStatus", label: "PEP status", type: "select", options: ["No", "Yes — Domestic PEP", "Yes — Foreign PEP", "Yes — Relative or close associate"], required: true, hint: "Politically Exposed Person screening" },
    { key: "controlType", label: "Type of control", type: "select", options: ["Direct shareholding", "Indirect shareholding", "Voting rights", "Other means of control"] },
  ],
  summary: (d) => `${d.fullName ?? "—"} · ${d.ownershipPercent ?? "—"}%`,
};

const SOURCE_OF_FUNDS: DocumentSchema = {
  displayName: "Source of funds",
  purpose: "Origin of transaction funds",
  section: "Source of Funds",
  fields: [
    { key: "sourceType", label: "Source type", type: "select", required: true, options: [
      "Salary / wages",
      "Business income",
      "Sale of asset",
      "Inheritance",
      "Investment returns",
      "Loan proceeds",
      "Gift",
      "Other",
    ]},
    { key: "amount", label: "Amount", type: "number", required: true, inputMode: "decimal" },
    { key: "currency", label: "Currency", type: "select", options: ["AUD", "USD", "EUR", "GBP", "SGD", "HKD"], required: true },
    { key: "dateReceived", label: "Date received / expected", type: "date" },
    { key: "description", label: "Description", type: "textarea", required: true, placeholder: "e.g. Sale of investment property at 22 King St, settlement 15 May 2026." },
  ],
  summary: (d) =>
    d.amount
      ? `${d.sourceType ?? "—"} · ${d.currency ?? "AUD"} ${Number(d.amount).toLocaleString()}`
      : (d.sourceType ?? "—"),
};

const GENERIC: DocumentSchema = {
  displayName: "Supporting document",
  purpose: "Reviewer notes",
  section: "Other",
  fields: [
    { key: "reference", label: "Reference / title", type: "text", required: true },
    { key: "notes", label: "Reviewer notes", type: "textarea", placeholder: "What does this document establish?" },
  ],
  summary: (d) => d.reference ?? "Supporting document",
};

/* ---------------- Dispatch ---------------- */

export function schemaFor(doc: UploadedDocument): DocumentSchema {
  const n = doc.name.toLowerCase();
  if (n.includes("passport")) return PASSPORT;
  if (n.includes("licence") || n.includes("license") || n.includes("driver")) return DRIVERS_LICENCE;
  if (n.includes("utility") || n.includes("bill") || n.includes("electric") || n.includes("water"))
    return UTILITY_BILL;
  if (n.includes("asic") || n.includes("extract") || n.includes("abn")) return ASIC_EXTRACT;
  if (n.includes("trust") || n.includes("deed")) return TRUST_DEED;
  if (n.includes("beneficial") || n.includes("ubo") || n.includes("ownership") || n.includes("declaration"))
    return BENEFICIAL_OWNER;
  if (n.includes("source") || n.includes("funds") || n.includes("sof") || n.includes("bank"))
    return SOURCE_OF_FUNDS;

  // Fall back to category if the filename didn't match anything specific.
  switch (doc.category) {
    case "Identity":
      return PASSPORT;
    case "Address":
      return UTILITY_BILL;
    case "Business":
      return ASIC_EXTRACT;
    case "Trust":
      return TRUST_DEED;
    case "Ownership":
      return BENEFICIAL_OWNER;
    case "Financial":
      return SOURCE_OF_FUNDS;
    default:
      return GENERIC;
  }
}
