"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  FileDown,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskPill } from "@/components/risk-pill";
import { StatusPill } from "@/components/status-pill";
import { FileGlyph } from "@/components/onboarding/document-dropzone";
import { useStore } from "@/lib/store";
import { getReviewer } from "@/lib/reviewers";
import { formatCurrency, formatRelative, initials } from "@/lib/utils";

/**
 * A single unified view of a client, with the four flow entry points
 * (upload, analyse, officer, report) presented as next-action cards.
 */
export function ClientDetailScreen({ clientId }: { clientId: string }) {
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
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { label: client.name },
        ]}
        eyebrow={`Case ${client.reference}`}
        title={client.name}
        description={client.purpose}
        actions={
          <>
            <Button variant="outline" size="md" asChild>
              <Link href={`/clients/${clientId}/upload`}>
                <UploadCloud className="h-4 w-4" />
                Add documents
              </Link>
            </Button>
            <Button size="md" asChild>
              <Link href={`/clients/${clientId}/officer`}>
                <Sparkles className="h-4 w-4" />
                Open AI Officer
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-sm font-semibold text-[var(--primary)]">
                    {initials(client.name)}
                  </div>
                  <div>
                    <CardTitle>{client.name}</CardTitle>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {client.entityType} · {client.industry} · {client.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskPill risk={client.risk} />
                  <StatusPill status={client.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                <Kv label="Reference" value={client.reference} />
                <Kv label="Segment" value={client.segment} />
                <Kv
                  label="Expected TXN"
                  value={formatCurrency(client.expectedTransactionAmount)}
                />
                <Kv label="Reviewer" value={reviewer.name} />
                <Kv
                  label="Created"
                  value={formatRelative(client.createdAt)}
                />
                <Kv label="Last update" value={formatRelative(client.updatedAt)} />
                <Kv label="Documents" value={client.documents.length.toString()} />
                <Kv
                  label="Outstanding"
                  value={client.outstandingItems.length.toString()}
                />
              </dl>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FlowCard
              href={`/clients/${clientId}/upload`}
              icon={UploadCloud}
              title="Upload documents"
              description={`${client.documents.length} document${client.documents.length === 1 ? "" : "s"} on file. Add or replace anything you need.`}
              cta="Manage documents"
            />
            <FlowCard
              href={`/clients/${clientId}/analysis`}
              icon={Sparkles}
              title="Run AI analysis"
              description={
                analysis
                  ? `Last analysed ${formatRelative(analysis.generatedAt)}. Re-run to update.`
                  : "Sentinel will read every document in under 4 seconds."
              }
              cta={analysis ? "Re-run analysis" : "Analyse now"}
            />
            <FlowCard
              href={`/clients/${clientId}/officer`}
              icon={ClipboardCheck}
              title="AI Compliance Officer"
              description={
                analysis
                  ? `Recommendation drafted with ${analysis.confidence}% confidence. Review before sign-off.`
                  : "Once you analyse, the officer view will draft your decision."
              }
              cta="Open officer view"
              disabled={!analysis}
            />
            <FlowCard
              href={`/clients/${clientId}/report`}
              icon={FileDown}
              title="Generate report"
              description="Beautiful, printable compliance report with full audit trail."
              cta="Generate report"
              disabled={!analysis}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-[var(--foreground-muted)]">
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {client.documents.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {client.documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                    >
                      <FileGlyph name={d.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-[var(--foreground-subtle)]">
                          {d.category} · {(d.sizeKb / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <Badge
                        variant={
                          d.status === "verified"
                            ? "success"
                            : d.status === "flagged"
                              ? "warning"
                              : "brand"
                        }
                        size="sm"
                      >
                        {d.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-[var(--foreground-muted)]">
                Outstanding items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {client.outstandingItems.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">
                  Nothing outstanding.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {client.outstandingItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-[var(--foreground-muted)]">
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="relative flex flex-col gap-4">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[var(--border)]" />
                {client.audit.slice(0, 8).map((event, i) => (
                  <motion.li
                    key={event.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative flex gap-3"
                  >
                    <div
                      className={
                        "relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[var(--surface)]"
                      }
                      style={{
                        background:
                          event.actorRole === "AI"
                            ? "var(--primary)"
                            : event.actorRole === "Reviewer"
                              ? "var(--accent)"
                              : event.actorRole === "Client"
                                ? "var(--warning)"
                                : "var(--foreground-subtle)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {event.action}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
                        {event.actor} · {formatRelative(event.timestamp)}
                      </p>
                      {event.detail ? (
                        <p className="mt-1 text-xs text-[var(--foreground-muted)] line-clamp-2">
                          {event.detail}
                        </p>
                      ) : null}
                    </div>
                  </motion.li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--foreground)] truncate">
        {value}
      </dd>
    </div>
  );
}

function FlowCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
  disabled,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  disabled?: boolean;
}) {
  const inner = (
    <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]">
            <Icon className="h-4 w-4" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-[var(--foreground-subtle)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <p className="mt-4 text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)] leading-relaxed">
          {description}
        </p>
        <p className="mt-4 text-xs font-semibold text-[var(--primary)]">
          {cta} <ArrowRight className="inline h-3 w-3" />
        </p>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return <div className="opacity-60 pointer-events-none">{inner}</div>;
  }
  return <Link href={href}>{inner}</Link>;
}
