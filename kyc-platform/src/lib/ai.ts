/**
 * Simulated AI analysis engine.
 *
 * There is no real model call. The heuristic below reads the client profile
 * and the uploaded documents to produce a deterministic, believable report.
 * That way every demo run tells a coherent story.
 */

import type {
  AIAnalysis,
  AnalysisFinding,
  Client,
  Recommendation,
  RiskLevel,
  UploadedDocument,
} from "./types";

export const AI_PROGRESS_MESSAGES = [
  "Reading documents…",
  "Checking completeness…",
  "Reviewing ownership structure…",
  "Cross-referencing sanctions & PEP lists…",
  "Calculating risk score…",
  "Generating recommendations…",
  "Preparing compliance summary…",
] as const;

function hasDocumentIn(
  docs: UploadedDocument[],
  keywords: string[],
): UploadedDocument | undefined {
  const lower = docs.map((d) => ({ doc: d, s: d.name.toLowerCase() }));
  return lower.find(({ s }) => keywords.some((k) => s.includes(k)))?.doc;
}

function buildFindings(client: Client): AnalysisFinding[] {
  const { documents, entityType } = client;
  const findings: AnalysisFinding[] = [];

  const passport = hasDocumentIn(documents, ["passport"]);
  const licence = hasDocumentIn(documents, ["licence", "license", "dl", "driver"]);
  const utility = hasDocumentIn(documents, ["utility", "bill", "electric"]);
  const asic = hasDocumentIn(documents, ["asic", "extract", "abn"]);
  const trustDeed = hasDocumentIn(documents, ["trust", "deed"]);
  const beneficial = hasDocumentIn(documents, ["beneficial", "ubo", "ownership"]);
  const sof = hasDocumentIn(documents, ["source", "funds", "sof"]);

  findings.push({
    id: "f-passport",
    section: "Identity",
    label: "Passport",
    status: passport ? "ok" : "missing",
    detail: passport ? `Received (${passport.name})` : "Not provided",
  });
  findings.push({
    id: "f-licence",
    section: "Identity",
    label: "Driver's Licence",
    status: licence ? "ok" : "warning",
    detail: licence ? `Received (${licence.name})` : "Second ID not provided",
  });
  findings.push({
    id: "f-address",
    section: "Address",
    label: "Address verification",
    status: utility ? "ok" : "missing",
    detail: utility
      ? "Address confirmed via utility bill (< 3 months old)"
      : "No proof of address on file",
  });

  if (entityType === "Company" || entityType === "Trust" || entityType === "Partnership") {
    findings.push({
      id: "f-asic",
      section: "Business",
      label: "ASIC Extract",
      status: asic ? "ok" : "missing",
      detail: asic
        ? "ASIC extract received and directors confirmed"
        : "Company registration not verified",
    });
    findings.push({
      id: "f-ubo",
      section: "Ownership",
      label: "Beneficial Owner Declaration",
      status: beneficial ? "ok" : "missing",
      detail: beneficial
        ? "Beneficial owners declared (>25% threshold met)"
        : "Missing beneficial owner declaration",
    });
  }

  if (entityType === "Trust") {
    findings.push({
      id: "f-deed",
      section: "Trust",
      label: "Trust Deed",
      status: trustDeed ? "ok" : "missing",
      detail: trustDeed
        ? "Trust deed on file (all schedules present)"
        : "Trust deed not uploaded",
    });
  }

  findings.push({
    id: "f-sof",
    section: "Source of Funds",
    label: "Source of Funds",
    status: sof ? "ok" : "warning",
    detail: sof
      ? "Source of funds documented"
      : "Source of funds not supplied — request from client",
  });

  return findings;
}

function calculateRisk(
  client: Client,
  findings: AnalysisFinding[],
): { risk: RiskLevel; confidence: number; reasons: string[] } {
  let score = 20;
  const reasons: string[] = [];

  if (client.expectedTransactionAmount >= 1_000_000) {
    score += 20;
    reasons.push(
      `Expected transaction amount is high (${client.expectedTransactionAmount.toLocaleString("en-AU")} AUD)`,
    );
  } else if (client.expectedTransactionAmount >= 250_000) {
    score += 10;
  }

  if (client.entityType === "Trust") {
    score += 15;
    reasons.push("Trust structures introduce layered beneficial ownership");
  } else if (client.entityType === "Company") {
    score += 8;
  } else if (client.entityType === "Partnership") {
    score += 6;
  }

  if (client.country !== "Australia") {
    score += 12;
    reasons.push(`Cross-border relationship detected (${client.country})`);
  }

  const highRiskIndustries = [
    "Mining",
    "Import / Export",
    "Real Estate",
    "Financial Services",
    "Hospitality",
  ];
  if (highRiskIndustries.includes(client.industry)) {
    score += 8;
    reasons.push(`Industry (${client.industry}) sits in AUSTRAC's higher-risk cohort`);
  }

  const missing = findings.filter((f) => f.status === "missing").length;
  const warnings = findings.filter((f) => f.status === "warning").length;
  score += missing * 6;
  score += warnings * 2;

  if (missing > 0) {
    reasons.push(`${missing} required document${missing > 1 ? "s" : ""} outstanding`);
  }

  // Story: pretend we noticed multiple directorships for higher tx amounts.
  if (client.entityType === "Company" && client.expectedTransactionAmount >= 500_000) {
    reasons.push("Director holds beneficial interest in 3 related entities");
  }
  if (client.country !== "Australia" && client.entityType !== "Individual") {
    reasons.push("Foreign director detected on ASIC extract");
  }

  const risk: RiskLevel = score >= 55 ? "High" : score >= 30 ? "Medium" : "Low";
  const confidence = Math.max(78, Math.min(99, 100 - Math.floor(missing * 1.8)));

  return { risk, confidence, reasons: reasons.slice(0, 4) };
}

function buildRecommendations(
  client: Client,
  findings: AnalysisFinding[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const missing = findings.filter((f) => f.status === "missing");

  if (missing.find((f) => f.section === "Source of Funds")) {
    recs.push({
      id: "rec-sof",
      title: "Request Source of Funds documentation",
      severity: "critical",
      why: `Under AML/CTF Rule 4.13.4, reporting entities must establish and record the source of funds where a customer's transactions materially exceed their expected profile. Given the expected amount of ${client.expectedTransactionAmount.toLocaleString("en-AU")} AUD, a documented Source of Funds statement (payslips, sale contract, dividend statement, or accountant's letter) is required before onboarding.`,
      citation: "AUSTRAC AML/CTF Rules, Chapter 4 §4.13",
    });
  }

  if (missing.find((f) => f.section === "Ownership")) {
    recs.push({
      id: "rec-ubo",
      title: "Verify Beneficial Ownership (25% threshold)",
      severity: "critical",
      why: "Australian Tranche 2 requires identification of every individual who owns 25% or more of the entity, directly or indirectly, and every individual who exercises control. Collect a signed Beneficial Owner Declaration and cross-reference against the ASIC extract.",
      citation: "AML/CTF Act 2006, s84 & AUSTRAC Rule 4.12",
    });
  }

  if (missing.find((f) => f.section === "Trust")) {
    recs.push({
      id: "rec-trust",
      title: "Obtain full Trust Deed with all schedules",
      severity: "critical",
      why: "For trust customers the reporting entity must collect the full trust deed, identifying the settlor, trustees, appointor, and each named or class beneficiary. Redacted schedules are not acceptable — request the complete signed deed.",
      citation: "AUSTRAC AML/CTF Rules 4.4",
    });
  }

  if (missing.find((f) => f.section === "Business")) {
    recs.push({
      id: "rec-asic",
      title: "Verify ASIC company extract",
      severity: "warning",
      why: "Company customers must have their registration verified against the ASIC national database. Pull the current company extract, confirm directors, registered office and status = Registered.",
      citation: "AUSTRAC KYC Guidance 2024",
    });
  }

  if (missing.find((f) => f.section === "Address")) {
    recs.push({
      id: "rec-address",
      title: "Obtain proof of residential address (< 3 months old)",
      severity: "warning",
      why: "A utility bill, bank statement, or council rates notice issued within the last 90 days is required to satisfy the customer identification procedure. Screenshots of online accounts are not acceptable.",
    });
  }

  recs.push({
    id: "rec-annual",
    title: "Schedule annual KYC refresh",
    severity: "info",
    why: "Ongoing customer due diligence requires periodic review. Sentinel will automatically re-run screening on the anniversary of onboarding and flag any material change in ownership, PEP status, or sanctions.",
  });

  if (client.country !== "Australia") {
    recs.push({
      id: "rec-cross-border",
      title: "Apply Enhanced Due Diligence (cross-border)",
      severity: "warning",
      why: `Because the client is registered in ${client.country}, enhanced due diligence applies. Collect an additional independent identity document, verify tax residency, and screen against FATF grey/black lists.`,
      citation: "FATF Recommendation 10",
    });
  }

  return recs.slice(0, 6);
}

function buildNextSteps(missingCount: number): string[] {
  const steps: string[] = [];
  if (missingCount > 0) {
    steps.push(`Collect ${missingCount} outstanding document${missingCount > 1 ? "s" : ""} from client`);
  }
  steps.push("Senior reviewer approval required before onboarding");
  steps.push("Log decision & rationale in the compliance register");
  steps.push("Complete onboarding and enable transaction monitoring");
  return steps;
}

export function analyseClient(client: Client): AIAnalysis {
  const findings = buildFindings(client);
  const missing = findings.filter((f) => f.status === "missing");
  const { risk, confidence, reasons } = calculateRisk(client, findings);
  const recommendations = buildRecommendations(client, findings);

  const overallStatus: AIAnalysis["overallStatus"] =
    missing.length === 0
      ? "READY FOR REVIEW"
      : missing.length <= 1
        ? "READY FOR REVIEW"
        : risk === "High"
          ? "ESCALATE"
          : "NEEDS ATTENTION";

  const summary = buildSummary(client, findings, risk);

  return {
    confidence,
    risk,
    overallStatus,
    reasons: reasons.length ? reasons : ["No adverse signals detected in profile"],
    recommendations,
    nextSteps: buildNextSteps(missing.length),
    findings,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

function buildSummary(client: Client, findings: AnalysisFinding[], risk: RiskLevel) {
  const missing = findings.filter((f) => f.status === "missing").map((f) => f.label);
  const ok = findings.filter((f) => f.status === "ok").length;
  const parts: string[] = [];

  parts.push(
    `${client.name} is a ${client.entityType.toLowerCase()} in the ${client.industry.toLowerCase()} sector, registered in ${client.country}.`,
  );
  parts.push(
    `Sentinel reviewed ${client.documents.length} document${client.documents.length === 1 ? "" : "s"} and confirmed ${ok} core KYC control${ok === 1 ? "" : "s"}.`,
  );
  if (missing.length) {
    parts.push(
      `Outstanding: ${missing.join(", ")}. Onboarding cannot complete until these are collected.`,
    );
  } else {
    parts.push("All required controls are satisfied. Proceed to senior reviewer approval.");
  }
  parts.push(
    risk === "High"
      ? "Overall risk is HIGH — enhanced due diligence and senior sign-off are required."
      : risk === "Medium"
        ? "Overall risk is MEDIUM — standard due diligence with a documented rationale is sufficient."
        : "Overall risk is LOW — routine onboarding is appropriate.",
  );
  return parts.join(" ");
}
