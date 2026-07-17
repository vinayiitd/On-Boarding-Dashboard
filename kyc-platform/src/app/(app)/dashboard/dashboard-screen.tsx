"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock,
  FileCheck2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskPill } from "@/components/risk-pill";
import { StatusPill } from "@/components/status-pill";
import { useStore } from "@/lib/store";
import { getReviewer } from "@/lib/reviewers";
import { formatCurrency, formatRelative, initials } from "@/lib/utils";
import type { AuditEvent, Client } from "@/lib/types";

/**
 * The landing dashboard. Investors see this first — it needs to communicate:
 *  1. What the product is  (headline card, AI copilot voice)
 *  2. That it is being used (metric cards with realistic numbers)
 *  3. That the workflow is under control (recent activity + at-risk clients)
 */
export function DashboardScreen() {
  const { state } = useStore();
  const clients = state.clients;

  const pendingReviews = clients.filter(
    (c) => c.status === "in_review" || c.status === "ready",
  );
  const completed = clients.filter((c) => c.status === "approved");
  const highRisk = clients.filter((c) => c.risk === "High");
  const totalClients = clients.length;
  const escalated = clients.filter((c) => c.status === "escalated").length;

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
    .slice(0, 7);

  const readyToReview = clients
    .filter((c) => c.status === "ready" || c.status === "in_review")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        eyebrow="Compliance workspace"
        title={
          <span className="text-balance">
            Good morning, Amelia — Sentinel handled{" "}
            <span className="text-[var(--primary)]">17 checks</span> overnight.
          </span>
        }
        description="Your AI compliance officer has reviewed every new document, flagged what's missing, and drafted your next actions. Here's where things stand."
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

      {/* Hero KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Clock}
          tone="brand"
          label="Pending reviews"
          value={pendingReviews.length.toString()}
          delta="+2 vs. yesterday"
          hint="Awaiting reviewer sign-off"
          href="/reviews"
        />
        <MetricCard
          icon={FileCheck2}
          tone="success"
          label="Completed"
          value={completed.length.toString()}
          delta="98% on-time"
          hint="Approved in the last 30 days"
        />
        <MetricCard
          icon={ShieldAlert}
          tone="danger"
          label="High risk"
          value={highRisk.length.toString()}
          delta={`${escalated} escalated`}
          hint="Requires enhanced due diligence"
        />
        <MetricCard
          icon={Users}
          tone="accent"
          label="Clients"
          value={totalClients.toString()}
          delta="+4 this week"
          hint="Across accounting, legal & real estate"
        />
      </div>

      {/* AI banner */}
      <AICopilotBanner clients={clients} />

      {/* Two-column: reviews + activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Ready for review</CardTitle>
              <p className="text-sm text-[var(--foreground-muted)]">
                Sentinel has finished analysis. Your review is the last step.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reviews">
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {readyToReview.length === 0 ? (
              <EmptyReviews />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {readyToReview.map((c, idx) => (
                  <ReviewRow key={c.id} client={c} index={idx} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-sm text-[var(--foreground-muted)]">
              Every AI check and reviewer action, in order.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="relative flex flex-col gap-4">
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[var(--border)]" />
              {recentActivity.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
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
          </CardContent>
        </Card>
      </div>

      {/* High risk callout */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>High-risk clients</CardTitle>
            <p className="text-sm text-[var(--foreground-muted)]">
              Enhanced due diligence in progress or required.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reviews">
              Open case queue
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {highRisk.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-6 py-10 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-[var(--success)]" />
              <p className="mt-2 text-sm font-medium">
                No high-risk clients right now.
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Sentinel will alert you if that changes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {highRisk.map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                >
                  <HighRiskCard client={client} />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Sub-components -------------------- */

const toneStyles = {
  brand: {
    ring: "border-[color-mix(in_srgb,var(--primary)_18%,var(--border))]",
    icon: "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]",
  },
  success: {
    ring: "border-[color-mix(in_srgb,var(--success)_18%,var(--border))]",
    icon: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]",
  },
  danger: {
    ring: "border-[color-mix(in_srgb,var(--danger)_18%,var(--border))]",
    icon: "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))]",
  },
  accent: {
    ring: "border-[color-mix(in_srgb,var(--accent)_18%,var(--border))]",
    icon: "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color-mix(in_srgb,var(--accent)_80%,var(--foreground))]",
  },
} as const;

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  tone,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  tone: keyof typeof toneStyles;
  href?: string;
}) {
  const styles = toneStyles[tone];
  const inner = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group rounded-2xl border ${styles.ring} bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </div>
      <div className="mt-4">
        <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[32px] font-semibold tracking-tight leading-none">
            {value}
          </span>
          {delta ? (
            <span className="text-xs font-medium text-[var(--foreground-subtle)]">
              {delta}
            </span>
          ) : null}
        </div>
        {hint ? (
          <p className="mt-2 text-xs text-[var(--foreground-subtle)]">{hint}</p>
        ) : null}
      </div>
    </motion.div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function AICopilotBanner({ clients }: { clients: Client[] }) {
  const missing = clients.reduce(
    (acc, c) => acc + (c.outstandingItems?.length ?? 0),
    0,
  );
  const escalated = clients.filter((c) => c.status === "escalated").length;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6"
    >
      <div className="absolute inset-0 opacity-70">
        <div
          aria-hidden
          className="absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary) 25%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -left-24 -bottom-32 h-72 w-72 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%)",
          }}
        />
      </div>
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Sentinel is caught up.
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)] max-w-2xl text-pretty">
              I&apos;ve analysed every uploaded document, flagged{" "}
              <strong className="text-[var(--foreground)]">{missing}</strong>{" "}
              outstanding items across your book, and escalated{" "}
              <strong className="text-[var(--foreground)]">{escalated}</strong>{" "}
              case
              {escalated === 1 ? "" : "s"} to senior review. Nothing else needs
              your attention right now.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reviews">
              Open queue
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
    </motion.div>
  );
}

function ReviewRow({ client, index }: { client: Client; index: number }) {
  const reviewer = getReviewer(client.reviewerId);
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <Link
        href={`/clients/${client.id}`}
        className="flex items-center gap-4 py-4 transition-colors hover:bg-[var(--surface-muted)]/60 rounded-xl px-2 -mx-2"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-muted))] text-sm font-semibold text-[var(--primary)]">
          {initials(client.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {client.name}
            </p>
            <span className="text-xs text-[var(--foreground-subtle)]">
              · {client.reference}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
            {client.entityType} · {client.industry} ·{" "}
            {formatCurrency(client.expectedTransactionAmount)} expected
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <RiskPill risk={client.risk} size="sm" />
          <StatusPill status={client.status} />
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px]">
              {reviewer.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-[var(--foreground-muted)]">
            {reviewer.name.split(" ")[0]}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </motion.li>
  );
}

function EmptyReviews() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
      <ShieldCheck className="mx-auto h-8 w-8 text-[var(--success)]" />
      <p className="mt-2 text-sm font-medium">You&apos;re all caught up.</p>
      <p className="text-sm text-[var(--foreground-muted)]">
        Create a new client to start onboarding.
      </p>
      <Button size="sm" className="mt-4" asChild>
        <Link href="/clients/new">
          <Plus className="h-4 w-4" />
          New client
        </Link>
      </Button>
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
  const roleColor: Record<AuditEvent["actorRole"], string> = {
    AI: "bg-[color-mix(in_srgb,var(--primary)_18%,var(--surface))] text-[var(--primary)]",
    Reviewer:
      "bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface))] text-[var(--accent)]",
    Client:
      "bg-[color-mix(in_srgb,var(--warning)_18%,var(--surface))] text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]",
    System: "bg-[var(--surface-muted)] text-[var(--foreground-muted)]",
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="relative flex items-start gap-3 pl-0"
    >
      <div
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[var(--surface)] ${roleColor[event.actorRole]}`}
      >
        <span className="text-[10px] font-semibold">
          {event.actorRole === "AI" ? "AI" : event.actor.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--foreground)]">
          <span className="font-medium">{event.action}</span>{" "}
          <Link
            href={`/clients/${event.clientId}`}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            · {event.clientName}
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
          {formatRelative(event.timestamp)}
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

function HighRiskCard({ client }: { client: Client }) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[color-mix(in_srgb,var(--danger)_80%,var(--foreground))] text-xs font-semibold">
            {initials(client.name)}
          </div>
          <div>
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-[var(--foreground-subtle)]">
              {client.entityType} · {client.country}
            </p>
          </div>
        </div>
        <RiskPill risk={client.risk} size="sm" />
      </div>
      <p className="mt-3 text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
        {client.analysis?.reasons[0] ??
          "Enhanced due diligence in progress. Awaiting additional documentation."}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-[var(--foreground-subtle)]">
          {formatCurrency(client.expectedTransactionAmount)}
        </span>
        <span className="text-[var(--primary)] font-medium opacity-0 transition-opacity group-hover:opacity-100">
          Open case →
        </span>
      </div>
    </Link>
  );
}
