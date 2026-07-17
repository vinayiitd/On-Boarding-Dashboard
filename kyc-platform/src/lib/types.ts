/**
 * Core domain types for Sentinel — AI Compliance Officer.
 * These mirror the shape of what the (imagined) FastAPI backend would return.
 */

export type EntityType = "Individual" | "Company" | "Trust" | "Partnership";

export type ClientStatus =
  | "draft"
  | "collecting"
  | "in_review"
  | "ready"
  | "approved"
  | "escalated";

export type RiskLevel = "Low" | "Medium" | "High";

export type Industry =
  | "Legal"
  | "Accounting"
  | "Real Estate"
  | "Construction"
  | "Retail"
  | "Hospitality"
  | "Technology"
  | "Mining"
  | "Agriculture"
  | "Financial Services"
  | "Import / Export"
  | "Other";

export type Country =
  | "Australia"
  | "New Zealand"
  | "United Kingdom"
  | "United States"
  | "Singapore"
  | "Hong Kong"
  | "United Arab Emirates"
  | "Other";

export type CustomerSegment = "Accountant" | "Lawyer" | "Real Estate";

export interface Reviewer {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  sizeKb: number;
  uploadedAt: string;
  status: "verified" | "flagged" | "processing" | "pending";
  pages?: number;
  /**
   * Fields captured from the document by the reviewer.
   * Present once the document has been verified via the verify-identity flow.
   */
  verifiedData?: Record<string, string>;
  verifiedAt?: string;
}

export type DocumentCategory =
  | "Identity"
  | "Address"
  | "Business"
  | "Trust"
  | "Ownership"
  | "Financial"
  | "Other";

export interface Recommendation {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  why: string;
  citation?: string;
}

export interface AnalysisFinding {
  id: string;
  section: "Identity" | "Business" | "Address" | "Ownership" | "Trust" | "Source of Funds";
  label: string;
  status: "ok" | "missing" | "warning";
  detail?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: "AI" | "Reviewer" | "System" | "Client";
  action: string;
  detail?: string;
}

export interface AIAnalysis {
  confidence: number;
  risk: RiskLevel;
  overallStatus:
    | "READY FOR REVIEW"
    | "NEEDS ATTENTION"
    | "ESCALATE"
    | "APPROVED";
  reasons: string[];
  recommendations: Recommendation[];
  nextSteps: string[];
  findings: AnalysisFinding[];
  summary: string;
  generatedAt: string;
}

export interface Client {
  id: string;
  reference: string;
  name: string;
  entityType: EntityType;
  industry: Industry;
  country: Country;
  segment: CustomerSegment;
  expectedTransactionAmount: number;
  purpose: string;
  reviewerId: string;
  status: ClientStatus;
  risk: RiskLevel;
  createdAt: string;
  updatedAt: string;
  documents: UploadedDocument[];
  analysis: AIAnalysis | null;
  audit: AuditEvent[];
  reviewerDecision?: {
    decision: "Approved" | "Escalated" | "Rejected";
    notes: string;
    decidedAt: string;
    decidedBy: string;
  };
  complianceNotes?: string;
  outstandingItems: string[];
}
