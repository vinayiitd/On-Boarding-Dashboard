import type { Client, UploadedDocument, AuditEvent } from "./types";
import { analyseClient } from "./ai";

/**
 * Seed clients used to populate the demo. These give the dashboard some
 * gravity — a real book of business at various stages of onboarding.
 */

function iso(daysAgo: number, hoursOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursOffset);
  return d.toISOString();
}

function doc(
  id: string,
  name: string,
  category: UploadedDocument["category"],
  sizeKb: number,
  daysAgo = 1,
  status: UploadedDocument["status"] = "verified",
  pages?: number,
): UploadedDocument {
  return {
    id,
    name,
    category,
    sizeKb,
    uploadedAt: iso(daysAgo),
    status,
    pages,
  };
}

function audit(
  id: string,
  actor: string,
  actorRole: AuditEvent["actorRole"],
  action: string,
  daysAgo: number,
  hours = 0,
  detail?: string,
): AuditEvent {
  return {
    id,
    timestamp: iso(daysAgo, hours),
    actor,
    actorRole,
    action,
    detail,
  };
}

const clientsRaw: Omit<Client, "analysis">[] = [
  {
    id: "c-atlas-holdings",
    reference: "KYC-2841",
    name: "Atlas Holdings Pty Ltd",
    entityType: "Company",
    industry: "Real Estate",
    country: "Australia",
    segment: "Real Estate",
    expectedTransactionAmount: 2_400_000,
    purpose: "Commercial property acquisition — Melbourne CBD",
    reviewerId: "r-1",
    status: "in_review",
    risk: "Medium",
    createdAt: iso(3),
    updatedAt: iso(0, 2),
    outstandingItems: ["Source of Funds", "Beneficial Owner Declaration"],
    documents: [
      doc("d-1", "Passport - Director.pdf", "Identity", 842, 2, "verified", 2),
      doc("d-2", "DriversLicence.jpg", "Identity", 412, 2, "verified"),
      doc("d-3", "UtilityBill.pdf", "Address", 218, 2, "verified", 1),
      doc("d-4", "ASICExtract.pdf", "Business", 1204, 1, "verified", 4),
    ],
    audit: [
      audit("a1", "Amelia Chen", "Reviewer", "Created client profile", 3, 4),
      audit("a2", "Client Portal", "Client", "Uploaded 4 documents", 2, 6, "Passport, Licence, Utility Bill, ASIC extract"),
      audit("a3", "Sentinel AI", "AI", "Ran initial analysis", 2, 3),
      audit("a4", "Sentinel AI", "AI", "Flagged missing Source of Funds", 2, 3),
      audit("a5", "Amelia Chen", "Reviewer", "Requested Source of Funds from client", 1, 5),
    ],
  },
  {
    id: "c-riverside-trust",
    reference: "KYC-2840",
    name: "Riverside Family Trust",
    entityType: "Trust",
    industry: "Financial Services",
    country: "Australia",
    segment: "Accountant",
    expectedTransactionAmount: 1_200_000,
    purpose: "Investment portfolio restructure",
    reviewerId: "r-2",
    status: "escalated",
    risk: "High",
    createdAt: iso(6),
    updatedAt: iso(0, 4),
    outstandingItems: ["Trust Deed (Schedule B)", "Beneficial Owner Declaration"],
    documents: [
      doc("d-5", "Passport - Trustee.pdf", "Identity", 780, 5, "verified", 2),
      doc("d-6", "DriversLicence - Trustee.jpg", "Identity", 388, 5),
      doc("d-7", "UtilityBill.pdf", "Address", 202, 5),
      doc("d-8", "TrustDeed - Redacted.pdf", "Trust", 3120, 4, "flagged", 18),
    ],
    audit: [
      audit("b1", "Marcus Whitmore", "Reviewer", "Created client profile", 6),
      audit("b2", "Client Portal", "Client", "Uploaded 4 documents", 5),
      audit("b3", "Sentinel AI", "AI", "Detected redacted schedules in Trust Deed", 4, 8),
      audit("b4", "Marcus Whitmore", "Reviewer", "Escalated to senior review", 3, 6, "Redacted schedules require unredacted copy"),
    ],
  },
  {
    id: "c-northwind-legal",
    reference: "KYC-2839",
    name: "Northwind Legal Group",
    entityType: "Partnership",
    industry: "Legal",
    country: "Australia",
    segment: "Lawyer",
    expectedTransactionAmount: 380_000,
    purpose: "Retainer for property conveyancing",
    reviewerId: "r-3",
    status: "approved",
    risk: "Low",
    createdAt: iso(11),
    updatedAt: iso(2, 3),
    outstandingItems: [],
    documents: [
      doc("d-9", "Passport - Partner1.pdf", "Identity", 812, 10),
      doc("d-10", "Passport - Partner2.pdf", "Identity", 795, 10),
      doc("d-11", "PartnershipAgreement.pdf", "Business", 2210, 10, "verified", 22),
      doc("d-12", "UtilityBill.pdf", "Address", 198, 9),
      doc("d-13", "SourceOfFunds.pdf", "Financial", 480, 9, "verified", 3),
    ],
    audit: [
      audit("c1", "Priya Natarajan", "Reviewer", "Created client profile", 11),
      audit("c2", "Client Portal", "Client", "Uploaded 5 documents", 10),
      audit("c3", "Sentinel AI", "AI", "Confirmed all identity controls", 10),
      audit("c4", "Priya Natarajan", "Reviewer", "Approved onboarding", 2, 3),
    ],
    reviewerDecision: {
      decision: "Approved",
      notes:
        "All identity, business and source of funds documentation confirmed. Standard due diligence applied. Next review scheduled in 12 months.",
      decidedAt: iso(2, 3),
      decidedBy: "Priya Natarajan",
    },
    complianceNotes:
      "Straight-forward partnership onboarding. Low transaction volume expected. No adverse media found.",
  },
  {
    id: "c-solstice-mining",
    reference: "KYC-2838",
    name: "Solstice Mining Corp",
    entityType: "Company",
    industry: "Mining",
    country: "Singapore",
    segment: "Accountant",
    expectedTransactionAmount: 8_500_000,
    purpose: "Cross-border equipment financing",
    reviewerId: "r-1",
    status: "escalated",
    risk: "High",
    createdAt: iso(4),
    updatedAt: iso(0, 1),
    outstandingItems: [
      "Source of Funds",
      "Beneficial Owner Declaration",
      "Tax residency certificate",
    ],
    documents: [
      doc("d-14", "Passport - Director.pdf", "Identity", 852, 3),
      doc("d-15", "ASIC Extract.pdf", "Business", 1420, 3, "verified", 6),
      doc("d-16", "Utility Bill.pdf", "Address", 214, 3),
    ],
    audit: [
      audit("e1", "Amelia Chen", "Reviewer", "Created client profile", 4),
      audit("e2", "Client Portal", "Client", "Uploaded 3 documents", 3),
      audit("e3", "Sentinel AI", "AI", "Detected foreign director on ASIC extract", 3),
      audit("e4", "Sentinel AI", "AI", "Applied Enhanced Due Diligence workflow", 3),
      audit("e5", "Amelia Chen", "Reviewer", "Escalated to AML Lead", 1, 4),
    ],
  },
  {
    id: "c-fern-accounting",
    reference: "KYC-2837",
    name: "Fern & Co Chartered Accountants",
    entityType: "Company",
    industry: "Accounting",
    country: "Australia",
    segment: "Accountant",
    expectedTransactionAmount: 620_000,
    purpose: "Fund administration services",
    reviewerId: "r-4",
    status: "collecting",
    risk: "Low",
    createdAt: iso(1, 4),
    updatedAt: iso(0, 8),
    outstandingItems: ["ASIC Extract", "Beneficial Owner Declaration"],
    documents: [
      doc("d-17", "Passport - Director.pdf", "Identity", 780, 1),
      doc("d-18", "DriversLicence.jpg", "Identity", 356, 1),
    ],
    audit: [
      audit("f1", "Jordan Baker", "Reviewer", "Created client profile", 1, 4),
      audit("f2", "Client Portal", "Client", "Uploaded 2 documents", 1),
      audit("f3", "Sentinel AI", "AI", "Requested outstanding documents", 0, 20),
    ],
  },
  {
    id: "c-harbour-property",
    reference: "KYC-2836",
    name: "Harbour Property Group",
    entityType: "Company",
    industry: "Real Estate",
    country: "Australia",
    segment: "Real Estate",
    expectedTransactionAmount: 1_850_000,
    purpose: "Off-the-plan apartment sales trust account",
    reviewerId: "r-2",
    status: "ready",
    risk: "Medium",
    createdAt: iso(5),
    updatedAt: iso(0, 5),
    outstandingItems: [],
    documents: [
      doc("d-19", "Passport - Director.pdf", "Identity", 812, 4),
      doc("d-20", "DriversLicence.jpg", "Identity", 402, 4),
      doc("d-21", "UtilityBill.pdf", "Address", 208, 4),
      doc("d-22", "ASICExtract.pdf", "Business", 1180, 4, "verified", 4),
      doc("d-23", "BeneficialOwnerDeclaration.pdf", "Ownership", 340, 3),
      doc("d-24", "SourceOfFunds.pdf", "Financial", 512, 3),
    ],
    audit: [
      audit("g1", "Marcus Whitmore", "Reviewer", "Created client profile", 5),
      audit("g2", "Client Portal", "Client", "Uploaded 6 documents", 4),
      audit("g3", "Sentinel AI", "AI", "Confirmed all controls", 3, 6),
      audit("g4", "Sentinel AI", "AI", "Report ready for reviewer sign-off", 0, 5),
    ],
  },
  {
    id: "c-blueline-partners",
    reference: "KYC-2835",
    name: "Blueline Legal Partners",
    entityType: "Partnership",
    industry: "Legal",
    country: "Australia",
    segment: "Lawyer",
    expectedTransactionAmount: 220_000,
    purpose: "Estate administration",
    reviewerId: "r-3",
    status: "collecting",
    risk: "Low",
    createdAt: iso(0, 6),
    updatedAt: iso(0, 1),
    outstandingItems: ["Partnership Agreement", "Source of Funds"],
    documents: [
      doc("d-25", "Passport - Partner.pdf", "Identity", 802, 0, "processing"),
    ],
    audit: [
      audit("h1", "Priya Natarajan", "Reviewer", "Created client profile", 0, 6),
      audit("h2", "Client Portal", "Client", "Uploaded 1 document", 0, 3),
    ],
  },
];

/**
 * Attach a computed AI analysis to every seed client so the dashboard
 * shows coherent risk levels immediately on first load.
 */
export const SEED_CLIENTS: Client[] = clientsRaw.map((c) => {
  const withoutAnalysis: Client = { ...c, analysis: null } as Client;
  const analysis = analyseClient(withoutAnalysis);
  return { ...withoutAnalysis, analysis, risk: analysis.risk };
});
