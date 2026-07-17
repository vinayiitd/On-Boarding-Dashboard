"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Printer,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useStore } from "@/lib/store";
import { getReviewer } from "@/lib/reviewers";
import { formatCurrency, formatDate, formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AnalysisFinding } from "@/lib/types";

/**
 * Printable compliance report.
 *
 * The whole page is designed to look like a boutique consulting deliverable
 * on-screen and print to A4 cleanly via the browser dialog.
 */
export function ReportScreen({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { getClient } = useStore();
  const client = getClient(clientId);

  if (!client) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Client not found.</p>
        <Button className="mt-4" asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const analysis = client.analysis;
  const reviewer = getReviewer(client.reviewerId);

  return (
    <div className="mx-auto max-w-[880px] px-4 py-8 md:px-8 md:py-10">
      {/* Toolbar (hidden on print) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--primary)]">
            Onboarding · Step 4 of 4
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Compliance report
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Preview, then print or save as PDF to share with your file.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button size="md" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print / save PDF
          </Button>
        </div>
      </div>

      {/* Report */}
      <article
        className={cn(
          "print-page relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-[#0b1220]",
          "shadow-[var(--shadow-card)]",
          "print:shadow-none print:rounded-none print:border-none",
        )}
      >
        {/* Header band */}
        <header className="relative border-b border-[#e5e7eb] px-10 py-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, #2563EB 0%, #14B8A6 50%, #2563EB 100%)",
            }}
          />
          <div className="flex items-center justify-between">
            <Logo size={32} />
            <div className="text-right text-xs text-[#5a6172]">
              <p className="font-medium uppercase tracking-wider">
                Confidential — Internal use
              </p>
              <p className="mt-0.5">
                Generated {formatDate(new Date())} · Ref {client.reference}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
              KYC Compliance Report · AUSTRAC Tranche 2
            </p>
            <h2 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">
              {client.name}
            </h2>
            <p className="mt-1 text-[15px] text-[#5a6172]">{client.purpose}</p>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-6 border-t border-[#e5e7eb] pt-6">
            <ReportKv label="Entity" value={client.entityType} />
            <ReportKv label="Industry" value={client.industry} />
            <ReportKv label="Country" value={client.country} />
            <ReportKv
              label="Expected TXN"
              value={formatCurrency(client.expectedTransactionAmount)}
            />
          </div>
        </header>

        <div className="px-10 py-8 space-y-10">
          {/* Executive summary */}
          <Section
            no="01"
            title="Executive summary"
            icon={Sparkles}
            eyebrow="Sentinel AI"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                label="Overall status"
                value={analysis?.overallStatus ?? "PENDING"}
                tone={
                  analysis?.overallStatus === "READY FOR REVIEW"
                    ? "success"
                    : analysis?.overallStatus === "ESCALATE"
                      ? "danger"
                      : "warning"
                }
              />
              <SummaryCard
                label="Risk"
                value={analysis?.risk ?? "—"}
                tone={
                  analysis?.risk === "High"
                    ? "danger"
                    : analysis?.risk === "Medium"
                      ? "warning"
                      : "success"
                }
              />
              <SummaryCard
                label="Confidence"
                value={analysis ? `${analysis.confidence}%` : "—"}
                tone="brand"
              />
            </div>
            {analysis ? (
              <p className="mt-6 text-[14.5px] leading-relaxed text-[#232a3a]">
                {analysis.summary}
              </p>
            ) : (
              <p className="mt-6 text-sm text-[#5a6172]">
                No AI analysis has been run for this client yet.
              </p>
            )}
          </Section>

          {/* Risk rationale */}
          {analysis && analysis.reasons.length ? (
            <Section
              no="02"
              title="Risk rationale"
              icon={AlertTriangle}
              eyebrow="Signals weighted by Sentinel"
            >
              <ul className="space-y-3 text-[14.5px] text-[#232a3a]">
                {analysis.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* Findings */}
          {analysis ? (
            <Section
              no="03"
              title="Findings by section"
              icon={ShieldCheck}
              eyebrow="Documents reviewed & controls tested"
            >
              <FindingsTable findings={analysis.findings} />
            </Section>
          ) : null}

          {/* Documents */}
          <Section
            no="04"
            title="Documents reviewed"
            icon={FileText}
            eyebrow={`${client.documents.length} file${client.documents.length === 1 ? "" : "s"} on file`}
          >
            {client.documents.length === 0 ? (
              <p className="text-sm text-[#5a6172]">
                No documents on file.
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-[#5a6172]">
                    <th className="border-b border-[#e5e7eb] py-2 pr-3 font-semibold">
                      Document
                    </th>
                    <th className="border-b border-[#e5e7eb] py-2 pr-3 font-semibold">
                      Category
                    </th>
                    <th className="border-b border-[#e5e7eb] py-2 pr-3 font-semibold">
                      Size
                    </th>
                    <th className="border-b border-[#e5e7eb] py-2 pr-3 font-semibold text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {client.documents.map((d) => (
                    <tr key={d.id} className="align-top">
                      <td className="border-b border-[#f1f3f6] py-2.5 pr-3 font-medium text-[#0b1220]">
                        {d.name}
                      </td>
                      <td className="border-b border-[#f1f3f6] py-2.5 pr-3 text-[#5a6172]">
                        {d.category}
                      </td>
                      <td className="border-b border-[#f1f3f6] py-2.5 pr-3 text-[#5a6172] tabular-nums">
                        {(d.sizeKb / 1024).toFixed(1)} MB
                      </td>
                      <td className="border-b border-[#f1f3f6] py-2.5 pr-3 text-right">
                        <PrintBadge
                          tone={
                            d.status === "verified"
                              ? "success"
                              : d.status === "flagged"
                                ? "warning"
                                : "brand"
                          }
                        >
                          {d.status}
                        </PrintBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Outstanding items */}
          <Section
            no="05"
            title="Outstanding items"
            icon={AlertTriangle}
            eyebrow="Actions before onboarding can close"
          >
            {client.outstandingItems.length === 0 ? (
              <p className="text-sm text-[#5a6172]">
                All required documentation has been collected.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {client.outstandingItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-3 py-2 text-sm"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Audit timeline */}
          <Section
            no="06"
            title="Audit timeline"
            icon={CheckCircle2}
            eyebrow="Every action logged, in order"
          >
            <ol className="relative space-y-4 pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-[#e5e7eb]" />
              {client.audit.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full ring-2 ring-white"
                    style={{
                      background:
                        event.actorRole === "AI"
                          ? "#2563EB"
                          : event.actorRole === "Reviewer"
                            ? "#14B8A6"
                            : event.actorRole === "Client"
                              ? "#F59E0B"
                              : "#8a91a1",
                    }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#0b1220]">
                        {event.action}
                      </p>
                      {event.detail ? (
                        <p className="mt-0.5 text-xs text-[#5a6172] leading-relaxed">
                          {event.detail}
                        </p>
                      ) : null}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-[#5a6172]">
                      <div>{event.actor}</div>
                      <div>{formatRelative(event.timestamp)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* Reviewer decision */}
          <Section
            no="07"
            title="Reviewer decision"
            icon={ShieldCheck}
            eyebrow="Sign-off & rationale"
          >
            <div className="rounded-xl border border-[#e5e7eb] bg-[#fafbfc] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#5a6172] font-semibold">
                    Reviewer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0b1220]">
                    {reviewer.name}
                  </p>
                  <p className="text-xs text-[#5a6172]">{reviewer.role}</p>
                </div>
                {client.reviewerDecision ? (
                  <PrintBadge
                    tone={
                      client.reviewerDecision.decision === "Approved"
                        ? "success"
                        : client.reviewerDecision.decision === "Escalated"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {client.reviewerDecision.decision}
                  </PrintBadge>
                ) : (
                  <PrintBadge tone="warning">Pending decision</PrintBadge>
                )}
              </div>
              <p className="mt-4 text-[14.5px] leading-relaxed text-[#232a3a]">
                {client.reviewerDecision?.notes ??
                  "Reviewer sign-off is pending. Sentinel's recommendation is available in the AI Officer view for consideration."}
              </p>
              {client.reviewerDecision ? (
                <p className="mt-3 text-xs text-[#5a6172]">
                  Decision recorded {formatRelative(client.reviewerDecision.decidedAt)}.
                </p>
              ) : null}
            </div>
          </Section>

          {/* Notes */}
          <Section
            no="08"
            title="Compliance notes"
            icon={Info}
            eyebrow="For your records"
          >
            <p className="text-[14.5px] leading-relaxed text-[#232a3a]">
              {client.complianceNotes ??
                "This report was generated by Sentinel — an AI compliance officer for Australian accountants, lawyers and real estate agencies. It reflects information available at the time of generation. All decisions remain the responsibility of the reporting entity in accordance with the AML/CTF Act 2006 and AUSTRAC rules."}
            </p>
          </Section>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#e5e7eb] px-10 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5a6172]">
            <div className="flex items-center gap-2">
              <Logo size={20} showWordmark={false} />
              <span>
                <strong className="text-[#0b1220]">Sentinel</strong> · AI
                Compliance Officer
              </span>
            </div>
            <p>
              Page 1 of 1 · Ref {client.reference} · Generated{" "}
              {formatDate(new Date())}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}

function Section({
  no,
  title,
  icon: Icon,
  eyebrow,
  children,
}: {
  no: string;
  title: string;
  icon: React.ElementType;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <span className="text-[11px] font-mono font-semibold text-[#8a91a1]">
          {no}
        </span>
        <div className="flex items-center gap-2 text-[#0b1220]">
          <Icon className="h-4 w-4 text-[#2563EB]" />
          <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      {eyebrow ? (
        <p className="mt-1 pl-[26px] text-xs text-[#5a6172]">{eyebrow}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ReportKv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[#8a91a1] font-semibold">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-[#0b1220]">{value}</dd>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "brand";
}) {
  const toneColor = {
    success: { fg: "#166534", bg: "#dcfce7", border: "#bbf7d0" },
    warning: { fg: "#854d0e", bg: "#fef9c3", border: "#fde68a" },
    danger: { fg: "#991b1b", bg: "#fee2e2", border: "#fecaca" },
    brand: { fg: "#1e40af", bg: "#dbeafe", border: "#bfdbfe" },
  }[tone];
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: toneColor.border, background: toneColor.bg }}
    >
      <p
        className="text-[10px] uppercase tracking-wider font-semibold"
        style={{ color: toneColor.fg }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-lg font-semibold tracking-tight"
        style={{ color: toneColor.fg }}
      >
        {value}
      </p>
    </div>
  );
}

function FindingsTable({ findings }: { findings: AnalysisFinding[] }) {
  const bySection = findings.reduce<
    Record<string, AnalysisFinding[]>
  >((acc, f) => {
    acc[f.section] = acc[f.section] ? [...acc[f.section], f] : [f];
    return acc;
  }, {});
  return (
    <div className="space-y-4">
      {Object.entries(bySection).map(([section, items]) => (
        <div key={section}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5a6172]">
            {section}
          </p>
          <ul className="mt-2 divide-y divide-[#f1f3f6] rounded-xl border border-[#e5e7eb]">
            {items.map((f) => {
              const iconMap = { ok: CheckCircle2, warning: AlertTriangle, missing: X };
              const Icon = iconMap[f.status];
              const color =
                f.status === "ok"
                  ? "#16a34a"
                  : f.status === "warning"
                    ? "#d97706"
                    : "#dc2626";
              return (
                <li key={f.id} className="flex items-start gap-3 p-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" color={color} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0b1220]">
                      {f.label}
                    </p>
                    {f.detail ? (
                      <p className="mt-0.5 text-xs text-[#5a6172]">{f.detail}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PrintBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "danger" | "brand";
}) {
  const toneColor = {
    success: { fg: "#166534", bg: "#dcfce7", border: "#bbf7d0" },
    warning: { fg: "#854d0e", bg: "#fef9c3", border: "#fde68a" },
    danger: { fg: "#991b1b", bg: "#fee2e2", border: "#fecaca" },
    brand: { fg: "#1e40af", bg: "#dbeafe", border: "#bfdbfe" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize"
      style={{
        color: toneColor.fg,
        background: toneColor.bg,
        borderColor: toneColor.border,
      }}
    >
      {children}
    </span>
  );
}
