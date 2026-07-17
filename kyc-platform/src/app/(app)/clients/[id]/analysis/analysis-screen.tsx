"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RiskPill } from "@/components/risk-pill";
import { AI_PROGRESS_MESSAGES } from "@/lib/ai";
import { useStore } from "@/lib/store";
import { cn, sleep } from "@/lib/utils";
import type { AIAnalysis, AnalysisFinding } from "@/lib/types";

type Phase = "idle" | "running" | "done";

export function AnalysisScreen({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { getClient, runAnalysis } = useStore();
  const client = getClient(clientId);
  const [phase, setPhase] = React.useState<Phase>(
    client?.analysis ? "done" : "idle",
  );
  const [progress, setProgress] = React.useState(0);
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [result, setResult] = React.useState<AIAnalysis | null>(
    client?.analysis ?? null,
  );

  const start = React.useCallback(async () => {
    setPhase("running");
    setResult(null);
    setProgress(0);
    setMessageIndex(0);

    const totalMs = 4500;
    const ticks = 100;
    const interval = totalMs / ticks;
    const messagesEvery = Math.floor(ticks / AI_PROGRESS_MESSAGES.length);

    for (let i = 1; i <= ticks; i++) {
      await sleep(interval);
      setProgress(i);
      if (i % messagesEvery === 0) {
        setMessageIndex((m) =>
          Math.min(m + 1, AI_PROGRESS_MESSAGES.length - 1),
        );
      }
    }
    const analysis = runAnalysis(clientId);
    if (analysis) setResult(analysis);
    setPhase("done");
  }, [clientId, runAnalysis]);

  const autoStarted = React.useRef(false);
  React.useEffect(() => {
    if (autoStarted.current) return;
    if (phase === "idle" && !client?.analysis) {
      autoStarted.current = true;
      const id = window.setTimeout(() => {
        void start();
      }, 0);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { href: `/clients/${clientId}`, label: client.name },
          { label: "AI analysis" },
        ]}
        eyebrow="Onboarding · Step 3 of 4"
        title="AI analysis"
        description="Sentinel is reviewing every document, screening ownership and drafting your compliance decision."
        actions={
          <>
            <Button variant="outline" size="md" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {phase === "done" ? (
              <Button
                variant="outline"
                size="md"
                onClick={start}
                aria-label="Re-run analysis"
              >
                <RefreshCw className="h-4 w-4" />
                Re-run
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-6">
        <StepIndicator current={3} />
      </div>

      <AnimatePresence mode="wait">
        {phase !== "done" ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <RunningPanel
              progress={progress}
              messageIndex={messageIndex}
              client={client}
            />
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-col gap-6"
          >
            <ResultsPanel
              analysis={result!}
              onContinue={() => router.push(`/clients/${clientId}/officer`)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RunningPanel({
  progress,
  messageIndex,
  client,
}: {
  progress: number;
  messageIndex: number;
  client: NonNullable<ReturnType<typeof useStore>["state"]["clients"][number]>;
}) {
  const activeMessage = AI_PROGRESS_MESSAGES[messageIndex];
  const size = 200;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <div className="gradient-ring relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dot-bg radial-fade opacity-50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%), radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-9 py-16 px-6 md:py-20">
        {/* Trace line */}
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-[pulseSlow_1.4s_infinite]" />
            Sentinel · v1.2
          </span>
          <span>trace <span className="text-[var(--foreground-muted)]">·</span> {client.reference.toLowerCase()}</span>
        </div>

        {/* Big ring loader */}
        <div className="relative flex h-52 w-52 items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
            <defs>
              <linearGradient id="ring-g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--border)"
              strokeWidth={stroke}
              fill="none"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#ring-g)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              transition={{ duration: 0.4 }}
            />
          </svg>
          {/* Rotating orbit dots */}
          <motion.div
            aria-hidden
            className="absolute inset-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            {[0, 90, 180, 270].map((deg) => (
              <span
                key={deg}
                className="absolute h-1.5 w-1.5 rounded-full bg-[var(--primary)]/40"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${deg}deg) translate(84px) rotate(-${deg}deg)`,
                }}
              />
            ))}
          </motion.div>
          <div className="relative flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[0_10px_28px_-8px_var(--primary)]">
              <Sparkles className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="mt-3 font-mono text-[26px] font-semibold tabular tracking-tight">
              {String(progress).padStart(2, "0")}
              <span className="text-[var(--foreground-subtle)] text-[16px]">%</span>
            </p>
          </div>
        </div>

        {/* Rotating headline */}
        <div className="text-center max-w-xl">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="font-display text-[26px] md:text-[30px] leading-[1.05] tracking-tight text-balance"
            >
              {activeMessage}
            </motion.p>
          </AnimatePresence>
          <p className="mt-3 text-[14px] text-[var(--foreground-muted)]">
            Reviewing {client.documents.length} document
            {client.documents.length === 1 ? "" : "s"} · cross-referencing
            sanctions & PEP lists · drafting a recommendation.
          </p>
        </div>

        <div className="w-full max-w-lg">
          <Progress
            value={progress}
            className="h-1.5"
            indicatorClassName="bg-[linear-gradient(90deg,var(--primary),color-mix(in_srgb,var(--accent)_80%,var(--primary)))]"
          />
        </div>

        <div className="grid w-full max-w-2xl grid-cols-3 divide-x divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 overflow-hidden">
          {[
            { label: "Documents", value: client.documents.length },
            { label: "Checks", value: 42 },
            { label: "Data points", value: 310 },
          ].map((s) => (
            <div key={s.label} className="p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
                {s.label}
              </p>
              <p className="mt-1 font-display text-[22px] font-medium leading-none tabular">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({
  analysis,
  onContinue,
}: {
  analysis: AIAnalysis;
  onContinue: () => void;
}) {
  const sections = groupBySection(analysis.findings);
  const missingCount = analysis.findings.filter((f) => f.status === "missing").length;
  const warningCount = analysis.findings.filter((f) => f.status === "warning").length;
  const okCount = analysis.findings.filter((f) => f.status === "ok").length;

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold tracking-tight">
                  Analysis complete
                </h3>
                <p className="mt-1 text-[13.5px] text-[var(--foreground-muted)] max-w-2xl">
                  {analysis.summary}
                </p>
              </div>
            </div>
            <div className="hidden md:flex gap-2 font-mono text-[10.5px] text-[var(--foreground-subtle)]">
              <span className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1">
                v1.2
              </span>
              <span className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1">
                4.1s
              </span>
              <span className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1">
                42 checks
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <StatTile
              label="Confidence"
              value={
                <span className="tabular">{analysis.confidence}%</span>
              }
              hint="Model certainty in decision"
            />
            <StatTile
              label="Risk"
              value={<RiskPill risk={analysis.risk} />}
              hint="Overall client risk"
            />
            <StatTile
              label="Status"
              value={
                <Badge
                  variant={
                    analysis.overallStatus === "READY FOR REVIEW"
                      ? "success"
                      : analysis.overallStatus === "ESCALATE"
                        ? "danger"
                        : "warning"
                  }
                  size="lg"
                >
                  {analysis.overallStatus}
                </Badge>
              }
              hint="Recommended next state"
            />
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 overflow-hidden">
            <FindingCounter label="Verified" count={okCount} tone="success" />
            <FindingCounter label="Needs attention" count={warningCount} tone="warning" />
            <FindingCounter label="Missing" count={missingCount} tone="danger" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Card>
              <div className="p-6 pb-3">
                <h4 className="text-[11px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
                  {s.name}
                </h4>
              </div>
              <div className="px-4 pb-4">
                <ul className="flex flex-col gap-1.5">
                  {s.findings
                    .sort((a, b) => severityRank(b.status) - severityRank(a.status))
                    .map((f) => (
                      <FindingRow key={f.id} finding={f} />
                    ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="gradient-ring relative overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--primary)_3%,var(--surface))] p-5 md:p-6">
        <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-[0_6px_20px_-6px_var(--primary)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">
                Meet Sentinel — your AI Compliance Officer
              </p>
              <p className="text-[13.5px] text-[var(--foreground-muted)]">
                Continue for the recommendation, rationale and next steps.
              </p>
            </div>
          </div>
          <Button size="lg" onClick={onContinue}>
            Open AI Compliance Officer
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function severityRank(s: AnalysisFinding["status"]) {
  return s === "missing" ? 2 : s === "warning" ? 1 : 0;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 p-4">
      <p className="text-[10.5px] uppercase tracking-[0.09em] text-[var(--foreground-subtle)] font-semibold">
        {label}
      </p>
      <div className="mt-1.5 font-display text-[26px] font-medium tracking-tight leading-none">
        {value}
      </div>
      {hint ? (
        <p className="mt-2 text-[11.5px] text-[var(--foreground-subtle)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function FindingCounter({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "success" | "warning" | "danger";
}) {
  const toneColor = {
    success: "color-mix(in srgb, var(--success) 80%, var(--foreground))",
    warning: "color-mix(in srgb, var(--warning) 80%, var(--foreground))",
    danger: "color-mix(in srgb, var(--danger) 80%, var(--foreground))",
  }[tone];
  return (
    <div className="flex items-center gap-3 p-4">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: toneColor }}
      />
      <div>
        <p className="text-[11px] uppercase tracking-[0.09em] font-semibold text-[var(--foreground-subtle)]">
          {label}
        </p>
        <p className="mt-0.5 font-display text-[20px] leading-none tabular">
          {count}
        </p>
      </div>
    </div>
  );
}

function FindingRow({ finding }: { finding: AnalysisFinding }) {
  const cfg = {
    ok: {
      icon: Check,
      tone: "text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)]",
      accent: "bg-[var(--success)]",
    },
    warning: {
      icon: AlertTriangle,
      tone: "text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
      accent: "bg-[var(--warning)]",
    },
    missing: {
      icon: X,
      tone: "text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]",
      accent: "bg-[var(--danger)]",
    },
  }[finding.status];
  const Icon = cfg.icon;
  return (
    <li
      className={cn(
        "relative flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors",
        finding.status !== "ok" && "hover:bg-[var(--surface-muted)]/50",
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          cfg.bg,
          cfg.tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13.5px]",
            finding.status === "ok"
              ? "text-[var(--foreground-muted)]"
              : "text-[var(--foreground)] font-medium",
          )}
        >
          {finding.label}
        </p>
        {finding.detail ? (
          <p className="mt-0.5 text-[11.5px] text-[var(--foreground-muted)] leading-snug">
            {finding.detail}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function groupBySection(findings: AnalysisFinding[]) {
  const order: AnalysisFinding["section"][] = [
    "Identity",
    "Address",
    "Business",
    "Ownership",
    "Trust",
    "Source of Funds",
  ];
  const map: Record<string, AnalysisFinding[]> = {};
  for (const f of findings) {
    map[f.section] = map[f.section] ? [...map[f.section], f] : [f];
  }
  return order
    .filter((s) => map[s]?.length)
    .map((s) => ({ name: s, findings: map[s] }));
}
