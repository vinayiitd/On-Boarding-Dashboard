"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  Info,
  ListChecks,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiskPill } from "@/components/risk-pill";
import { StatusPill } from "@/components/status-pill";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { getReviewer } from "@/lib/reviewers";
import { cn, formatCurrency } from "@/lib/utils";
import type { Recommendation } from "@/lib/types";

/**
 * Hero screen — the moment investors go "oh, this is the product".
 * Display type, layered rings, trace metadata, recommendation cards
 * with citation-style Why panels, reviewer sign-off dialog.
 */
export function OfficerScreen({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { getClient, recordDecision } = useStore();
  const client = getClient(clientId);
  const [openRec, setOpenRec] = React.useState<Recommendation | null>(null);
  const [decisionOpen, setDecisionOpen] = React.useState(false);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { href: `/clients/${clientId}`, label: client.name },
          { label: "AI Compliance Officer" },
        ]}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[var(--primary)]" />
            Sentinel · AI Compliance Officer
          </span>
        }
        title={
          <span className="text-balance">
            {client.name}{" "}
            <span className="font-serif italic text-[var(--foreground-subtle)] text-[26px] md:text-[32px] align-middle">
              · {client.reference}
            </span>
          </span>
        }
        description="I've read every document, screened ownership, and drafted a recommendation. Here's what I think you should do next."
        actions={
          <>
            <Button variant="outline" size="md" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => setDecisionOpen(true)}
              disabled={!client.analysis}
            >
              <Gavel className="h-4 w-4" />
              Record decision
            </Button>
            <Button size="md" asChild>
              <Link href={`/clients/${clientId}/report`}>
                Generate report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-6">
        <StepIndicator current={4} />
      </div>

      {!analysis ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[var(--primary)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                Identity verification isn&apos;t complete yet.
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Capture the fields from each uploaded document so Sentinel
                can draft the compliance recommendation.
              </p>
            </div>
            <Button asChild>
              <Link href={`/clients/${clientId}/analysis`}>
                Continue to Verify identity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <HeroCard client={client} analysis={analysis} className="mt-8" />

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <SectionHeading
                    icon={ListChecks}
                    title="Recommendations"
                    description="Why they matter and what to do next"
                  />
                  <Badge variant="brand" size="sm">
                    {analysis.recommendations.length} actions
                  </Badge>
                </div>
                <ul className="mt-5 flex flex-col gap-3">
                  {analysis.recommendations.map((rec, i) => (
                    <motion.li
                      key={rec.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35 }}
                    >
                      <RecommendationRow
                        rec={rec}
                        onWhy={() => setOpenRec(rec)}
                      />
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="pt-6">
                  <SectionHeading
                    icon={TrendingUp}
                    title="Why this risk?"
                    description="Signals Sentinel weighted"
                  />
                  <ul className="mt-4 flex flex-col gap-3 text-sm">
                    {analysis.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                        <span className="text-[var(--foreground-muted)] leading-relaxed text-[13.5px]">
                          {r}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <SectionHeading
                    icon={Clock}
                    title="Next steps"
                    description="What to do this week"
                  />
                  <ol className="mt-4 flex flex-col gap-3">
                    {analysis.nextSteps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[13.5px] text-[var(--foreground)]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[10.5px] font-semibold text-[var(--foreground-muted)] tabular">
                          {i + 1}
                        </span>
                        <span className="text-pretty leading-relaxed">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <SectionHeading
                  icon={UserCheck}
                  title="Reviewer"
                  description="Sign-off assigned to"
                />
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,var(--surface))] text-sm font-semibold text-[var(--primary)] font-display">
                    {getReviewer(client.reviewerId).initials}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-medium">
                      {getReviewer(client.reviewerId).name}
                    </p>
                    <p className="text-[11.5px] text-[var(--foreground-muted)]">
                      {getReviewer(client.reviewerId).role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <SectionHeading
                  icon={FileText}
                  title="Client profile"
                  description="What Sentinel reviewed"
                />
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                  <dt className="text-[var(--foreground-muted)]">Entity</dt>
                  <dd className="font-medium">{client.entityType}</dd>
                  <dt className="text-[var(--foreground-muted)]">Industry</dt>
                  <dd className="font-medium">{client.industry}</dd>
                  <dt className="text-[var(--foreground-muted)]">Country</dt>
                  <dd className="font-medium">{client.country}</dd>
                  <dt className="text-[var(--foreground-muted)]">Expected</dt>
                  <dd className="font-medium tabular">
                    {formatCurrency(client.expectedTransactionAmount)}
                  </dd>
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <SectionHeading
                  icon={BookMarked}
                  title="Status"
                  description="Where this client sits"
                />
                <div className="mt-4 flex flex-col gap-2">
                  <StatusPill status={client.status} />
                  <p className="text-[11.5px] text-[var(--foreground-muted)]">
                    {client.documents.length} document
                    {client.documents.length === 1 ? "" : "s"} on file ·{" "}
                    {client.outstandingItems.length} outstanding
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <WhyDialog rec={openRec} onOpenChange={(o) => !o && setOpenRec(null)} />

      <DecisionDialog
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        reviewerName={getReviewer(client.reviewerId).name}
        recommendation={analysis?.overallStatus ?? "READY FOR REVIEW"}
        onConfirm={(decision, notes) => {
          recordDecision(clientId, {
            decision,
            notes,
            decidedAt: new Date().toISOString(),
            decidedBy: getReviewer(client.reviewerId).name,
          });
          toast.success(`Decision recorded: ${decision}`);
          setDecisionOpen(false);
        }}
      />
    </div>
  );
}

/* -------------------- Sub-components -------------------- */

function HeroCard({
  client,
  analysis,
  className,
}: {
  client: ReturnType<typeof useStore>["state"]["clients"][number];
  analysis: NonNullable<
    ReturnType<typeof useStore>["state"]["clients"][number]["analysis"]
  >;
  className?: string;
}) {
  const statusTone =
    analysis.overallStatus === "READY FOR REVIEW"
      ? "success"
      : analysis.overallStatus === "ESCALATE"
        ? "danger"
        : "warning";

  const statusLabel = {
    success: "Approve to proceed",
    warning: "Additional evidence needed",
    danger: "Senior review required",
  }[statusTone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "gradient-ring relative overflow-hidden rounded-3xl border border-[var(--border)] p-6 md:p-10",
        "bg-[var(--surface)]",
        className,
      )}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 8% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%), radial-gradient(ellipse at 95% 100%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dot-bg radial-fade opacity-40"
      />

      <div className="relative grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          {/* Trace line */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-[pulseSlow_2s_infinite]" />
              Sentinel · v1.2
            </span>
            <span>4.1s · 42 checks · 310 data points</span>
          </div>

          <p className="mt-6 text-[13px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
            Overall status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <h2 className="font-display text-[52px] md:text-[68px] font-medium tracking-[-0.04em] leading-[0.98] text-balance">
              {analysis.overallStatus}
            </h2>
          </div>
          <p className="mt-3 text-[14px] font-medium text-[var(--foreground-muted)]">
            {statusLabel}
          </p>

          <p className="mt-6 max-w-2xl text-[15px] leading-[1.65] text-[var(--foreground-muted)] text-pretty">
            {analysis.summary}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <RiskPill risk={analysis.risk} size="lg" />
            <Badge variant="brand" size="lg">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="tabular">{analysis.confidence}%</span>{" "}
              confidence
            </Badge>
            <Badge variant="outline" size="lg">
              <span className="tabular">{client.documents.length}</span>{" "}
              documents reviewed
            </Badge>
          </div>
        </div>

        <ConfidenceRings
          confidence={analysis.confidence}
          risk={analysis.risk}
        />
      </div>
    </motion.div>
  );
}

/**
 * Two nested rings: outer = confidence (blue→teal), inner = risk (tone).
 * Sized to hero proportions.
 */
function ConfidenceRings({
  confidence,
  risk,
}: {
  confidence: number;
  risk: "Low" | "Medium" | "High";
}) {
  const size = 232;
  const outerR = 106;
  const innerR = 78;
  const outerC = outerR * 2 * Math.PI;
  const innerC = innerR * 2 * Math.PI;
  const riskValue = risk === "High" ? 90 : risk === "Medium" ? 55 : 25;
  const riskColor =
    risk === "High" ? "var(--danger)" : risk === "Medium" ? "var(--warning)" : "var(--success)";

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center md:h-64 md:w-64">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        <defs>
          <linearGradient id="confidence-g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        {/* Outer ring — confidence */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerR}
          stroke="var(--border)"
          strokeWidth={8}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={outerR}
          stroke="url(#confidence-g)"
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={outerC}
          initial={{ strokeDashoffset: outerC }}
          animate={{ strokeDashoffset: outerC - (confidence / 100) * outerC }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Inner ring — risk */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerR}
          stroke="var(--border)"
          strokeWidth={5}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={innerR}
          stroke={riskColor}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={innerC}
          initial={{ strokeDashoffset: innerC }}
          animate={{ strokeDashoffset: innerC - (riskValue / 100) * innerC }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
          Confidence
        </span>
        <span className="mt-1 font-display text-[54px] font-medium leading-none tabular tracking-[-0.03em]">
          {confidence}
          <span className="text-[var(--foreground-subtle)] text-[24px] align-top ml-0.5">
            %
          </span>
        </span>
        <span className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[var(--foreground-muted)]">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: riskColor }}
          />
          Risk <strong className="text-[var(--foreground)]">{risk}</strong>
        </span>
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
        <Icon className="h-4 w-4 text-[var(--foreground-subtle)]" strokeWidth={2} />
        {title}
      </div>
      {description ? (
        <p className="mt-1 text-[11.5px] text-[var(--foreground-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function RecommendationRow({
  rec,
  onWhy,
}: {
  rec: Recommendation;
  onWhy: () => void;
}) {
  const cfg = {
    critical: {
      icon: AlertTriangle,
      tone: "text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]",
      accent: "bg-[var(--danger)]",
      badge: <Badge variant="danger" size="sm">Critical</Badge>,
    },
    warning: {
      icon: Info,
      tone: "text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
      accent: "bg-[var(--warning)]",
      badge: <Badge variant="warning" size="sm">Action</Badge>,
    },
    info: {
      icon: ShieldCheck,
      tone: "text-[color-mix(in_srgb,var(--primary)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
      accent: "bg-[var(--primary)]",
      badge: <Badge variant="brand" size="sm">Best practice</Badge>,
    },
  }[rec.severity];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={onWhy}
      className="group relative flex w-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full",
          cfg.accent,
        )}
      />
      <div className="ml-1 flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            cfg.bg,
            cfg.tone,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
              {rec.title}
            </p>
            {cfg.badge}
          </div>
          {rec.citation ? (
            <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-[var(--foreground-subtle)]">
              {rec.citation}
            </p>
          ) : null}
          <p className="mt-1.5 text-[13.5px] text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
            {rec.why}
          </p>
        </div>
      </div>
      <span className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--primary)] transition-transform group-hover:translate-x-0.5">
        Why?
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function WhyDialog({
  rec,
  onOpenChange,
}: {
  rec: Recommendation | null;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={!!rec} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {rec ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-[0_4px_12px_-4px_var(--primary)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <Badge
                  variant={
                    rec.severity === "critical"
                      ? "danger"
                      : rec.severity === "warning"
                        ? "warning"
                        : "brand"
                  }
                  size="sm"
                >
                  {rec.severity === "critical"
                    ? "Critical"
                    : rec.severity === "warning"
                      ? "Action needed"
                      : "Best practice"}
                </Badge>
              </div>
              <DialogTitle className="mt-3 font-display text-[24px] leading-tight tracking-tight">
                {rec.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13.5px]">
                Sentinel&apos;s reasoning, in full.
              </DialogDescription>
            </DialogHeader>
            <p className="text-[14px] leading-relaxed text-[var(--foreground)]">
              {rec.why}
            </p>
            {rec.citation ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
                  <BookMarked className="h-3.5 w-3.5" />
                  Source
                </div>
                <p className="mt-1.5 font-serif text-[16px] leading-snug text-[var(--foreground)]">
                  {rec.citation}
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_3%,var(--surface))] p-4">
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
                Draft prepared
              </div>
              <p className="mt-1.5 text-[13.5px] text-[var(--foreground-muted)] leading-relaxed">
                An email requesting this documentation is waiting in your
                outbox. Sentinel will auto-file the reply against this client.
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DecisionDialog({
  open,
  onOpenChange,
  reviewerName,
  recommendation,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reviewerName: string;
  recommendation: string;
  onConfirm: (
    decision: "Approved" | "Escalated" | "Rejected",
    notes: string,
  ) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DecisionDialogBody
          key={String(open) + recommendation}
          reviewerName={reviewerName}
          recommendation={recommendation}
          onConfirm={onConfirm}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DecisionDialogBody({
  reviewerName,
  recommendation,
  onConfirm,
  onCancel,
}: {
  reviewerName: string;
  recommendation: string;
  onConfirm: (
    decision: "Approved" | "Escalated" | "Rejected",
    notes: string,
  ) => void;
  onCancel: () => void;
}) {
  const [decision, setDecision] = React.useState<
    "Approved" | "Escalated" | "Rejected"
  >(recommendation === "ESCALATE" ? "Escalated" : "Approved");
  const [notes, setNotes] = React.useState("");

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color-mix(in_srgb,var(--accent)_80%,var(--foreground))]">
            <Gavel className="h-4 w-4" />
          </div>
          <Badge variant="brand" size="sm">
            Sign-off · {reviewerName}
          </Badge>
        </div>
        <DialogTitle className="mt-3 font-display text-[24px] leading-tight tracking-tight">
          Record reviewer decision
        </DialogTitle>
        <DialogDescription>
          Sentinel recommends{" "}
          <strong className="text-[var(--foreground)]">
            {recommendation}
          </strong>
          . Confirm your decision — it will be added to the audit trail.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2.5">
        {(["Approved", "Escalated", "Rejected"] as const).map((d) => {
          const active = decision === d;
          const tone =
            d === "Approved"
              ? "success"
              : d === "Escalated"
                ? "warning"
                : "danger";
          const toneColor = {
            success: "var(--success)",
            warning: "var(--warning)",
            danger: "var(--danger)",
          }[tone];
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDecision(d)}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--border-strong))] bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{
                    background: active ? toneColor : "var(--surface-muted)",
                  }}
                >
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                <div>
                  <p className="text-[13.5px] font-medium">{d}</p>
                  <p className="text-[11.5px] text-[var(--foreground-muted)]">
                    {d === "Approved"
                      ? "Client passes KYC — proceed to onboarding"
                      : d === "Escalated"
                        ? "Refer to AML Lead for enhanced due diligence"
                        : "Reject the relationship and file a suspicious matter report if required"}
                  </p>
                </div>
              </div>
              <Badge variant={tone} size="sm">
                {d}
              </Badge>
            </button>
          );
        })}
      </div>
      <div className="grid gap-2">
        <Label>Compliance notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Rationale, any conditions, or a note for the audit trail."
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onConfirm(
              decision,
              notes.trim() || `${decision} — no additional notes.`,
            )
          }
        >
          Confirm decision
        </Button>
      </div>
    </>
  );
}
