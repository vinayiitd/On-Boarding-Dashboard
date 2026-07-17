"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Bot,
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus2,
  MessageSquareText,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskPill } from "@/components/risk-pill";
import { StatusPill } from "@/components/status-pill";
import { Sparkline } from "@/components/viz/sparkline";
import { useStore } from "@/lib/store";
import { getReviewer } from "@/lib/reviewers";
import { computeInsights, overnightChecks } from "@/lib/insights";
import { formatCurrency, formatRelative, initials } from "@/lib/utils";
import type { AuditEvent, Client } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

/**
 * The landing dashboard. First frame the demo shows an investor.
 * Ambition: it must communicate — in under 3 seconds — what the product is,
 * that it's already working, and where the reviewer should look next.
 */
export function DashboardScreen() {
  const { state } = useStore();
  const clients = state.clients;

  const kpis = computeInsights(clients);
  const overnight = overnightChecks(clients);

  const recentActivity = clients
    .flatMap((c) =>
      c.audit.map((a) => ({
        ...a,
        clientId: c.id,
        clientName: c.name,
        clientRef: c.reference,
      })),
    )
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 8);

  const readyToReview = clients
    .filter((c) => c.status === "ready" || c.status === "in_review")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  const highRisk = clients.filter((c) => c.risk === "High");

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 md:px-8 md:py-10"
    >
      <motion.div variants={item}>
        <PageHeader
          size="hero"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[var(--success)] animate-[pulseSlow_2s_infinite]" />
                <span className="relative h-full w-full rounded-full bg-[var(--success)]" />
              </span>
              Sentinel · Compliance workspace
            </span>
          }
          title={
            <span className="text-balance font-display">
              Good morning, Amelia. Sentinel handled{" "}
              <span className="brand-gradient-text tabular">
                {overnight} checks
              </span>{" "}
              overnight.
            </span>
          }
          description="Every uploaded document read, every ownership graph screened, every recommendation drafted. Here's what's left for you today."
          actions={
            <>
              <Button variant="outline" size="md" asChild>
                <Link href="/insights">
                  View insights
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="md" asChild>
                <Link href="/clients/new">
                  <Plus className="h-4 w-4" />
                  New client
                </Link>
              </Button>
            </>
          }
        />
      </motion.div>

      {/* KPI grid */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          icon={Clock}
          tone="brand"
          label="Pending reviews"
          kpi={kpis.pending}
          hint="Awaiting reviewer sign-off"
          href="/reviews"
        />
        <MetricCard
          icon={FileCheck2}
          tone="success"
          label="Completed"
          kpi={kpis.completed}
          hint="Approved in the last 30 days"
        />
        <MetricCard
          icon={ShieldAlert}
          tone="danger"
          label="High risk"
          kpi={kpis.highRisk}
          hint="Enhanced due diligence"
        />
        <MetricCard
          icon={Users}
          tone="accent"
          label="Clients"
          kpi={kpis.clients}
          hint="Across every practice area"
          href="/clients"
        />
      </motion.div>

      {/* AI hero banner */}
      <motion.div variants={item}>
        <AICopilotBanner clients={clients} overnight={overnight} />
      </motion.div>

      {/* Two-column: reviews + activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div variants={item} className="xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-3">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">
                  Ready for your review
                </h3>
                <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
                  Analysis complete. Your sign-off is the last step.
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reviews">
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="px-2 pb-2">
              {readyToReview.length === 0 ? (
                <EmptyReviews />
              ) : (
                <ul className="flex flex-col">
                  {readyToReview.map((c, idx) => (
                    <ReviewRow key={c.id} client={c} index={idx} />
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <div className="flex items-center justify-between p-6 pb-3">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">
                  Live activity
                </h3>
                <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
                  Every AI check and reviewer action, in order.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted)]/60 px-2 py-0.5 text-[10.5px] font-mono text-[var(--foreground-subtle)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-[pulseSlow_2s_infinite]" />
                live
              </span>
            </div>
            <div className="px-6 pb-6">
              <ol className="relative flex flex-col gap-4">
                <div
                  aria-hidden
                  className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--border)] via-[var(--border)] to-transparent"
                />
                {recentActivity.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-2/3" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                    ))
                  : recentActivity.map((event, i) => (
                      <ActivityRow key={event.id} event={event} index={i} />
                    ))}
              </ol>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* High risk callout */}
      <motion.div variants={item}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]">
                  <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2.4} />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight">
                  High-risk cases
                </h3>
              </div>
              <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
                Enhanced due diligence in progress or required.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/reviews">
                Open case queue
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="p-6 pt-0">
            {highRisk.length === 0 ? (
              <AllClearEmptyState />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {highRisk.map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <HighRiskCard client={client} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* -------------------- Sub-components -------------------- */

const toneStyles = {
  brand: {
    ring: "border-[var(--border)]",
    icon: "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]",
    spark: "var(--primary)",
  },
  success: {
    ring: "border-[var(--border)]",
    icon: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]",
    spark: "var(--success)",
  },
  danger: {
    ring: "border-[var(--border)]",
    icon: "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]",
    spark: "var(--danger)",
  },
  accent: {
    ring: "border-[var(--border)]",
    icon: "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color-mix(in_srgb,var(--accent)_80%,var(--foreground))]",
    spark: "var(--accent)",
  },
} as const;

function MetricCard({
  icon: Icon,
  label,
  hint,
  kpi,
  tone,
  href,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  kpi: { value: number; delta: number; series: number[] };
  tone: keyof typeof toneStyles;
  href?: string;
}) {
  const styles = toneStyles[tone];
  const positive = kpi.delta >= 0;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  const inner = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`surface-card group relative overflow-hidden rounded-2xl p-5 transition-shadow hover:shadow-[var(--shadow-elevated)]`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${styles.icon}`}>
          <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        ) : (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium tabular ${
              positive
                ? "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[color-mix(in_srgb,var(--success)_82%,var(--foreground))]"
                : "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[color-mix(in_srgb,var(--danger)_82%,var(--foreground))]"
            }`}
          >
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(kpi.delta)}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] text-[var(--foreground-muted)]">{label}</p>
          <p className="mt-1 text-[34px] font-display font-medium leading-none tabular tracking-tight">
            {kpi.value}
          </p>
          {hint ? (
            <p className="mt-2 text-[11.5px] text-[var(--foreground-subtle)]">
              {hint}
            </p>
          ) : null}
        </div>
        <div className="w-[110px] shrink-0">
          <Sparkline data={kpi.series} stroke={styles.spark} height={40} />
        </div>
      </div>
    </motion.div>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function AICopilotBanner({
  clients,
  overnight,
}: {
  clients: Client[];
  overnight: number;
}) {
  const missing = clients.reduce(
    (acc, c) => acc + (c.outstandingItems?.length ?? 0),
    0,
  );
  const escalated = clients.filter((c) => c.status === "escalated").length;

  return (
    <div
      className={
        "gradient-ring relative overflow-hidden rounded-2xl p-6 md:p-7 bg-[color-mix(in_srgb,var(--primary)_3%,var(--surface))]"
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
      >
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary) 25%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute -left-24 -bottom-32 h-80 w-80 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
          }}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 dot-bg radial-fade opacity-40" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-[0_6px_20px_-6px_var(--primary)]">
            <Bot className="h-[19px] w-[19px]" strokeWidth={2} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--foreground-subtle)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-[pulseSlow_2s_infinite]" />
                <span className="uppercase tracking-wider">Sentinel · v1.2</span>
              </span>
              <span className="text-[var(--foreground-subtle)]/70">•</span>
              <span>{overnight} checks · 3.8s avg</span>
            </div>
            <p className="mt-3 text-[22px] font-display leading-tight tracking-tight text-balance">
              I&apos;m caught up on your book.
            </p>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--foreground-muted)] text-pretty">
              I&apos;ve flagged{" "}
              <strong className="text-[var(--foreground)] tabular">{missing}</strong>{" "}
              outstanding item{missing === 1 ? "" : "s"} across your clients and
              escalated{" "}
              <strong className="text-[var(--foreground)] tabular">{escalated}</strong>{" "}
              case{escalated === 1 ? "" : "s"} to senior review. Nothing else
              needs your attention right now.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:flex-col lg:items-stretch">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reviews">
              Open review queue
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Start onboarding
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ client, index }: { client: Client; index: number }) {
  const reviewer = getReviewer(client.reviewerId);
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group"
    >
      <Link
        href={`/clients/${client.id}`}
        className="relative flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-[var(--surface-muted)]/70"
      >
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100"
        />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-muted))] text-[13px] font-semibold text-[var(--primary)] font-display">
          {initials(client.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-medium text-[var(--foreground)]">
              {client.name}
            </p>
            <span className="text-[11.5px] tabular text-[var(--foreground-subtle)]">
              · {client.reference}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--foreground-muted)]">
            {client.entityType} · {client.industry} ·{" "}
            <span className="tabular">
              {formatCurrency(client.expectedTransactionAmount)}
            </span>{" "}
            expected
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <RiskPill risk={client.risk} size="sm" />
          <StatusPill status={client.status} />
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {reviewer.initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] transition-all opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>
    </motion.li>
  );
}

function EmptyReviews() {
  return (
    <div className="px-6 py-12 text-center">
      <EmptyStateArt />
      <p className="mt-4 text-[15px] font-semibold tracking-tight">
        You&apos;re all caught up.
      </p>
      <p className="text-[13px] text-[var(--foreground-muted)]">
        Sentinel will alert you the moment new evidence arrives.
      </p>
      <Button size="sm" className="mt-5" asChild>
        <Link href="/clients/new">
          <Plus className="h-4 w-4" />
          New client
        </Link>
      </Button>
    </div>
  );
}

function AllClearEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/30 px-6 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]">
        <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <p className="mt-3 text-[14px] font-semibold tracking-tight">
        No high-risk clients right now.
      </p>
      <p className="text-[13px] text-[var(--foreground-muted)]">
        Sentinel is watching your book. You&apos;ll know before we do.
      </p>
    </div>
  );
}

function ActivityRow({
  event,
  index,
}: {
  event: AuditEvent & { clientName: string; clientRef: string; clientId: string };
  index: number;
}) {
  const config = activityIconFor(event);

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="relative flex items-start gap-3"
    >
      <div
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-[var(--surface)] ${config.tone}`}
      >
        <config.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] text-[var(--foreground)]">
          <span className="font-medium">{event.action}</span>{" "}
          <Link
            href={`/clients/${event.clientId}`}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            · {event.clientName}
          </Link>
        </p>
        <p className="mt-0.5 text-[11.5px] text-[var(--foreground-subtle)]">
          <span className="tabular">{formatRelative(event.timestamp)}</span>
          {event.detail ? (
            <span className="ml-2 text-[var(--foreground-muted)]">
              {event.detail.length > 60
                ? event.detail.slice(0, 57) + "…"
                : event.detail}
            </span>
          ) : null}
        </p>
      </div>
    </motion.li>
  );
}

function activityIconFor(event: AuditEvent): {
  icon: React.ElementType;
  tone: string;
} {
  const action = event.action.toLowerCase();
  if (event.actorRole === "AI") {
    if (action.includes("flagged") || action.includes("escalate"))
      return {
        icon: ShieldAlert,
        tone:
          "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[color-mix(in_srgb,var(--danger)_82%,var(--foreground))]",
      };
    if (action.includes("confirm"))
      return {
        icon: CheckCircle2,
        tone:
          "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_82%,var(--foreground))]",
      };
    return {
      icon: Sparkles,
      tone:
        "bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]",
    };
  }
  if (event.actorRole === "Client") {
    return {
      icon: UploadCloud,
      tone:
        "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[color-mix(in_srgb,var(--warning)_82%,var(--foreground))]",
    };
  }
  if (event.actorRole === "Reviewer") {
    if (action.includes("approved"))
      return {
        icon: CheckCircle2,
        tone:
          "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_82%,var(--foreground))]",
      };
    if (action.includes("escalat"))
      return {
        icon: ShieldAlert,
        tone:
          "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[color-mix(in_srgb,var(--danger)_82%,var(--foreground))]",
      };
    if (action.includes("created"))
      return {
        icon: FilePlus2,
        tone:
          "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color-mix(in_srgb,var(--accent)_82%,var(--foreground))]",
      };
    return {
      icon: MessageSquareText,
      tone:
        "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color-mix(in_srgb,var(--accent)_82%,var(--foreground))]",
    };
  }
  return {
    icon: FilePlus2,
    tone:
      "bg-[var(--surface-muted)] text-[var(--foreground-muted)]",
  };
}

function HighRiskCard({ client }: { client: Client }) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="group relative block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] hover:border-[color-mix(in_srgb,var(--danger)_30%,var(--border))]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[color-mix(in_srgb,var(--danger)_82%,var(--foreground))] text-[12px] font-semibold font-display">
            {initials(client.name)}
          </div>
          <div>
            <p className="text-[13.5px] font-medium tracking-tight">
              {client.name}
            </p>
            <p className="text-[11.5px] text-[var(--foreground-subtle)]">
              {client.entityType} · {client.country}
            </p>
          </div>
        </div>
        <RiskPill risk={client.risk} size="sm" />
      </div>
      <p className="mt-3 text-[12.5px] text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
        {client.analysis?.reasons[0] ??
          "Enhanced due diligence in progress. Awaiting additional documentation."}
      </p>
      <div className="mt-3 flex items-center justify-between text-[11.5px]">
        <span className="tabular text-[var(--foreground-subtle)]">
          {formatCurrency(client.expectedTransactionAmount)}
        </span>
        <span className="text-[var(--primary)] font-medium opacity-0 transition-opacity group-hover:opacity-100 inline-flex items-center gap-1">
          Open case
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Signature empty-state illustration — a subtle shield in line-art.
 * Purpose-drawn to feel intentional rather than a generic checkmark.
 */
function EmptyStateArt() {
  return (
    <svg
      viewBox="0 0 120 96"
      className="mx-auto h-16 w-auto text-[var(--foreground-subtle)]"
      aria-hidden
    >
      <defs>
        <linearGradient id="es-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d="M60 12l24 8v14c0 14-10 25-24 30-14-5-24-16-24-30V20l24-8z"
        fill="url(#es-g)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M48 46l9 9 15-15"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
