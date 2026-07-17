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
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Auto-start when the user arrives from the upload flow without prior analysis.
  // We defer the initial run to a microtask so that state updates it triggers
  // don't cascade off the mounting render.
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
              documentCount={client.documents.length}
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
  documentCount,
}: {
  progress: number;
  messageIndex: number;
  documentCount: number;
}) {
  const activeMessage = AI_PROGRESS_MESSAGES[messageIndex];
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 60%), radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%)",
        }}
      />
      <CardContent className="relative flex flex-col items-center gap-8 py-14 md:py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex h-24 w-24 items-center justify-center"
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, color-mix(in srgb, var(--primary) 60%, transparent), transparent)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
          <span className="absolute inset-[3px] rounded-full bg-[var(--surface)]" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[var(--primary)] shadow-[var(--shadow-card)]">
            <Sparkles className="h-6 w-6" />
          </span>
        </motion.div>

        <div className="text-center max-w-lg">
          <p className="text-2xl font-semibold tracking-tight">
            Sentinel is analysing this client
          </p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Reviewing {documentCount} document
            {documentCount === 1 ? "" : "s"}, cross-referencing sanctions
            & PEP lists, and drafting a recommendation.
          </p>
        </div>

        <div className="w-full max-w-lg">
          <Progress value={progress} className="h-2" />
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <AnimatePresence mode="wait">
              <motion.span
                key={activeMessage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="font-medium text-[var(--foreground)]"
              >
                {activeMessage}
              </motion.span>
            </AnimatePresence>
            <span className="tabular-nums">{progress}%</span>
          </div>
        </div>

        <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { label: "Documents", value: documentCount },
            { label: "Checks", value: "42" },
            { label: "Data points", value: "310" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center"
            >
              <p className="text-xs text-[var(--foreground-subtle)]">{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_75%,var(--foreground))]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Analysis complete</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">
                {analysis.summary}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 grid gap-3 md:grid-cols-3">
          <StatTile
            label="Confidence"
            value={`${analysis.confidence}%`}
            hint="Model certainty in decision"
          />
          <StatTile
            label="Risk"
            value={
              <span className="inline-flex items-center gap-2">
                <RiskPill risk={analysis.risk} />
              </span>
            }
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
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-[var(--foreground-muted)]">
                  {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="flex flex-col gap-2">
                  {s.findings.map((f) => (
                    <FindingRow key={f.id} finding={f} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Meet Sentinel — your AI Compliance Officer
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Continue to the officer view for the recommendation, rationale
                and next steps.
              </p>
            </div>
          </div>
          <Button size="lg" onClick={onContinue}>
            Open AI Compliance Officer
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </>
  );
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
      <p className="text-xs uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
        {label}
      </p>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}

function FindingRow({ finding }: { finding: AnalysisFinding }) {
  const cfg = {
    ok: {
      icon: Check,
      tone: "text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)]",
    },
    warning: {
      icon: AlertTriangle,
      tone: "text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
    },
    missing: {
      icon: X,
      tone: "text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]",
      bg: "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]",
    },
  }[finding.status];
  const Icon = cfg.icon;
  return (
    <li className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--surface-muted)]/50">
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          cfg.bg,
          cfg.tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{finding.label}</p>
        {finding.detail ? (
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            {finding.detail}
          </p>
        ) : null}
      </div>
      {finding.status === "ok" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
      ) : null}
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
