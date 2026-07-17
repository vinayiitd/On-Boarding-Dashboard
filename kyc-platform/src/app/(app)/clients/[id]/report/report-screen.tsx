"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
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
 * Printable compliance report. Reads as a boutique consulting deliverable
 * on screen and prints to A4 cleanly. Instrument Serif for the display
 * title, Inter for everything else.
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
  const reportRef = `SR-${client.reference.replace("KYC-", "")}-${new Date().getFullYear()}`;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-8 md:py-10">
      {/* Toolbar (hidden on print) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-medium uppercase tracking-[0.09em] text-[var(--foreground-subtle)]">
            Onboarding · Step 4 of 4
          </p>
          <h1 className="mt-1 font-display text-[28px] font-medium tracking-tight">
            Compliance report
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--foreground-muted)]">
            Preview, then print or save as PDF to share with your file.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" size="md" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Save as PDF
          </Button>
          <Button size="md" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Report */}
      <article
        className={cn(
          "print-page relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-[#0a0d14]",
          "shadow-[var(--shadow-elevated)]",
          "print:shadow-none print:rounded-none print:border-none",
        )}
      >
        {/* Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <span
            className="font-display text-[280px] font-medium leading-none tracking-tight text-[#0a0d14]/[0.024] select-none rotate-[-16deg]"
          >
            SENTINEL
          </span>
        </div>

        {/* Header band */}
        <header className="relative border-b border-[#e6e8ec] px-12 py-9">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, #2563EB 0%, #14B8A6 55%, #2563EB 100%)",
            }}
          />
          <div className="flex items-center justify-between">
            <Logo size={32} />
            <div className="text-right text-[11px] font-mono uppercase tracking-[0.09em] text-[#7d8494]">
              <p className="font-semibold text-[#2563EB]">
                Confidential — Internal
              </p>
              <p className="mt-0.5">
                <span className="tabular">{formatDate(new Date())}</span>
                <span className="mx-1 text-[#c4c8d0]">·</span>
                <span className="tabular">{reportRef}</span>
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-start justify-between gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                KYC Compliance Report · AUSTRAC Tranche 2
              </p>
              <h2 className="mt-3 font-serif text-[48px] leading-[1.02] tracking-tight text-[#0a0d14]">
                {client.name}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#545a6a]">
                {client.purpose}
              </p>
            </div>
            <QrBlock reportRef={reportRef} />
          </div>

          <div className="mt-8 grid grid-cols-4 gap-6 border-t border-[#eef0f3] pt-6">
            <ReportKv label="Entity" value={client.entityType} />
            <ReportKv label="Industry" value={client.industry} />
            <ReportKv label="Country" value={client.country} />
            <ReportKv
              label="Expected TXN"
              value={formatCurrency(client.expectedTransactionAmount)}
            />
          </div>
        </header>

        <div className="relative px-12 py-10 space-y-11">
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
              <p className="mt-6 font-serif text-[18px] leading-[1.6] text-[#232a3a]">
                {analysis.summary}
              </p>
            ) : (
              <p className="mt-6 text-sm text-[#545a6a]">
                No AI analysis has been run for this client yet.
              </p>
            )}
          </Section>

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
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

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

          <Section
            no="04"
            title="Documents reviewed"
            icon={FileText}
            eyebrow={`${client.documents.length} file${client.documents.length === 1 ? "" : "s"} on file`}
          >
            {client.documents.length === 0 ? (
              <p className="text-sm text-[#545a6a]">No documents on file.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[10.5px] uppercase tracking-[0.09em] text-[#7d8494]">
                    <th className="border-b border-[#e6e8ec] py-2 pr-3 font-semibold">
                      Document
                    </th>
                    <th className="border-b border-[#e6e8ec] py-2 pr-3 font-semibold">
                      Category
                    </th>
                    <th className="border-b border-[#e6e8ec] py-2 pr-3 font-semibold">
                      Size
                    </th>
                    <th className="border-b border-[#e6e8ec] py-2 pr-3 font-semibold text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {client.documents.map((d) => (
                    <tr key={d.id} className="align-top">
                      <td className="border-b border-[#f2f4f7] py-2.5 pr-3 font-medium text-[#0a0d14]">
                        {d.name}
                      </td>
                      <td className="border-b border-[#f2f4f7] py-2.5 pr-3 text-[#545a6a]">
                        {d.category}
                      </td>
                      <td className="border-b border-[#f2f4f7] py-2.5 pr-3 text-[#545a6a] tabular">
                        {(d.sizeKb / 1024).toFixed(1)} MB
                      </td>
                      <td className="border-b border-[#f2f4f7] py-2.5 pr-3 text-right">
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

          <Section
            no="05"
            title="Outstanding items"
            icon={AlertTriangle}
            eyebrow="Actions before onboarding can close"
          >
            {client.outstandingItems.length === 0 ? (
              <p className="text-sm text-[#545a6a]">
                All required documentation has been collected.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {client.outstandingItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-[#e6e8ec] bg-[#fafbfc] px-3 py-2 text-sm"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            no="06"
            title="Audit timeline"
            icon={CheckCircle2}
            eyebrow="Every action logged, in order"
          >
            <ol className="relative space-y-4 pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-[#e6e8ec]" />
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
                              : "#7d8494",
                    }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#0a0d14]">
                        {event.action}
                      </p>
                      {event.detail ? (
                        <p className="mt-0.5 text-xs text-[#545a6a] leading-relaxed">
                          {event.detail}
                        </p>
                      ) : null}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-[#545a6a] tabular">
                      <div>{event.actor}</div>
                      <div>{formatRelative(event.timestamp)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section
            no="07"
            title="Reviewer decision"
            icon={ShieldCheck}
            eyebrow="Sign-off & rationale"
          >
            <div className="rounded-xl border border-[#e6e8ec] bg-[#fafbfc] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.09em] text-[#7d8494] font-semibold">
                    Reviewer
                  </p>
                  <p className="mt-1 font-serif text-[22px] leading-tight text-[#0a0d14]">
                    {reviewer.name}
                  </p>
                  <p className="text-xs text-[#545a6a]">{reviewer.role}</p>
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

              {/* Signature block */}
              <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#e6e8ec] pt-6">
                <div>
                  <div className="h-12 border-b border-[#c4c8d0] flex items-end pb-1">
                    {client.reviewerDecision ? (
                      <span className="font-serif italic text-[22px] text-[#0a0d14]/70">
                        {reviewer.name}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[10.5px] uppercase tracking-[0.09em] text-[#7d8494] font-semibold">
                    Reviewer signature
                  </p>
                </div>
                <div>
                  <div className="h-12 border-b border-[#c4c8d0] flex items-end pb-1">
                    {client.reviewerDecision ? (
                      <span className="tabular text-[13px] text-[#545a6a]">
                        {formatDate(client.reviewerDecision.decidedAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[10.5px] uppercase tracking-[0.09em] text-[#7d8494] font-semibold">
                    Date
                  </p>
                </div>
              </div>
            </div>
          </Section>

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
        <footer className="border-t border-[#e6e8ec] px-12 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#7d8494]">
            <div className="flex items-center gap-2">
              <Logo size={20} showWordmark={false} />
              <span className="uppercase tracking-wider">
                Sentinel · AI Compliance Officer
              </span>
            </div>
            <p className="tabular">
              Page 1 of 1 · Ref {reportRef} · Generated{" "}
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
    <section className="relative">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] font-semibold text-[#c4c8d0] tabular tracking-wider">
          {no}
        </span>
        <div className="flex items-center gap-2 text-[#0a0d14]">
          <Icon className="h-4 w-4 text-[#2563EB]" strokeWidth={2.2} />
          <h3 className="font-display text-[20px] font-medium tracking-tight leading-tight">
            {title}
          </h3>
        </div>
      </div>
      {eyebrow ? (
        <p className="mt-1 pl-[30px] text-[11.5px] text-[#7d8494]">{eyebrow}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ReportKv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9.5px] uppercase tracking-[0.09em] text-[#a1a7b4] font-semibold">
        {label}
      </dt>
      <dd className="mt-1 text-[13.5px] font-medium text-[#0a0d14]">
        {value}
      </dd>
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
        className="text-[9.5px] uppercase tracking-[0.09em] font-semibold"
        style={{ color: toneColor.fg }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 font-display text-[22px] font-medium tracking-tight leading-none"
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
    <div className="space-y-5">
      {Object.entries(bySection).map(([section, items]) => (
        <div key={section}>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#7d8494]">
            {section}
          </p>
          <ul className="mt-2 divide-y divide-[#eef0f3] rounded-xl border border-[#e6e8ec] bg-white">
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
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0"
                    color={color}
                    strokeWidth={2.4}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0a0d14]">
                      {f.label}
                    </p>
                    {f.detail ? (
                      <p className="mt-0.5 text-xs text-[#545a6a]">{f.detail}</p>
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
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium capitalize"
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

/**
 * Faux QR-block for report verification. Purely decorative — draws a
 * finder-pattern QR silhouette so the printed report *looks* verifiable.
 */
function QrBlock({ reportRef }: { reportRef: string }) {
  // Deterministic 12×12 pattern from the report ref.
  const size = 12;
  const bits: boolean[] = [];
  let seed = 0;
  for (let i = 0; i < reportRef.length; i++)
    seed = (seed * 31 + reportRef.charCodeAt(i)) % 2147483647;
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 1664525 + 1013904223) % 2147483647;
    bits.push((seed & 1) === 1);
  }
  const cell = 4;
  const pad = 2;
  const total = size * cell + pad * 2;

  return (
    <div className="shrink-0 rounded-xl border border-[#e6e8ec] bg-white p-3">
      <svg
        width={total}
        height={total}
        viewBox={`0 0 ${total} ${total}`}
        aria-hidden
      >
        <rect width={total} height={total} fill="#ffffff" />
        {bits.map((on, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          if (!on) return null;
          return (
            <rect
              key={i}
              x={pad + x * cell}
              y={pad + y * cell}
              width={cell}
              height={cell}
              fill="#0a0d14"
            />
          );
        })}
        {/* Overlay stylized finder squares in three corners */}
        {[
          { x: pad, y: pad },
          { x: total - pad - 7 * cell, y: pad },
          { x: pad, y: total - pad - 7 * cell },
        ].map((f, idx) => (
          <g key={idx}>
            <rect
              x={f.x}
              y={f.y}
              width={7 * cell}
              height={7 * cell}
              fill="#ffffff"
            />
            <rect
              x={f.x}
              y={f.y}
              width={7 * cell}
              height={7 * cell}
              fill="none"
              stroke="#0a0d14"
              strokeWidth={cell}
            />
            <rect
              x={f.x + 2 * cell}
              y={f.y + 2 * cell}
              width={3 * cell}
              height={3 * cell}
              fill="#0a0d14"
            />
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-wider text-[#7d8494]">
        {reportRef}
      </p>
    </div>
  );
}
