"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Filter, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskPill } from "@/components/risk-pill";
import { StatusPill } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { getReviewer } from "@/lib/reviewers";
import { cn, formatCurrency, formatRelative, initials } from "@/lib/utils";
import type { Client, ClientStatus, RiskLevel } from "@/lib/types";

type Filter = "all" | ClientStatus | RiskLevel;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ready", label: "Ready" },
  { key: "in_review", label: "In review" },
  { key: "escalated", label: "Escalated" },
  { key: "approved", label: "Approved" },
  { key: "High", label: "High risk" },
];

/**
 * List/queue view. Two modes: full client list, or the review queue.
 */
export function ClientsListScreen({
  mode = "all",
}: {
  mode?: "all" | "reviews";
}) {
  const { state } = useStore();
  const [filter, setFilter] = React.useState<Filter>(
    mode === "reviews" ? "in_review" : "all",
  );
  const [query, setQuery] = React.useState("");

  const clients = React.useMemo(() => {
    let list = state.clients;
    if (mode === "reviews") {
      list = list.filter(
        (c) =>
          c.status === "in_review" ||
          c.status === "ready" ||
          c.status === "escalated",
      );
    }
    if (filter !== "all") {
      list = list.filter((c) => {
        if (filter === "High" || filter === "Medium" || filter === "Low") {
          return c.risk === filter;
        }
        return c.status === filter;
      });
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.reference.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [state.clients, filter, query, mode]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
      <PageHeader
        eyebrow={mode === "reviews" ? "Review queue" : "Book of business"}
        title={mode === "reviews" ? "Reviews" : "Clients"}
        description={
          mode === "reviews"
            ? "Everything currently waiting on a reviewer, ordered by last update."
            : "Every client Sentinel is looking after — with risk, status, and reviewer at a glance."
        }
        actions={
          <Button size="md" asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              New client
            </Link>
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.key} value={f.key}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <label
          className={cn(
            "group relative flex flex-1 md:max-w-xs items-center gap-2 rounded-[12px] border border-[var(--border)]",
            "bg-[var(--surface)] px-3 h-10 focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[var(--ring)]/20",
          )}
        >
          <Search className="h-4 w-4 text-[var(--foreground-subtle)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients"
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--foreground-subtle)] focus:outline-none"
          />
        </label>
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                  <th className="py-3 pl-6 pr-3 font-semibold">Client</th>
                  <th className="py-3 pr-3 font-semibold">Entity</th>
                  <th className="py-3 pr-3 font-semibold">Risk</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 pr-3 font-semibold">Expected</th>
                  <th className="py-3 pr-3 font-semibold">Reviewer</th>
                  <th className="py-3 pr-3 font-semibold">Updated</th>
                  <th className="py-3 pr-6 font-semibold text-right">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="px-6 py-16 text-center">
                        <Filter className="mx-auto h-8 w-8 text-[var(--foreground-subtle)]" />
                        <p className="mt-2 text-sm font-medium">
                          No clients match your filters.
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          Try clearing the search or picking a different tab.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map((c, i) => <Row key={c.id} client={c} index={i} />)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ client, index }: { client: Client; index: number }) {
  const reviewer = getReviewer(client.reviewerId);
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3 }}
      className="group relative border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface-muted)]/60"
    >
      <td className="py-3 pl-6 pr-3">
        <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r bg-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100"
          />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-muted))] text-[12px] font-semibold text-[var(--primary)] font-display">
            {initials(client.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium tracking-tight">
              {client.name}
            </p>
            <p className="text-[11.5px] tabular text-[var(--foreground-subtle)]">
              {client.reference}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-3 pr-3 text-[var(--foreground-muted)]">
        <span className="text-[13px]">{client.entityType}</span>
        <span className="mx-1 text-[var(--foreground-subtle)]">·</span>
        <span className="text-[11.5px]">{client.industry}</span>
      </td>
      <td className="py-3 pr-3">
        <RiskPill risk={client.risk} size="sm" />
      </td>
      <td className="py-3 pr-3">
        <StatusPill status={client.status} />
      </td>
      <td className="py-3 pr-3 tabular text-[13px] text-[var(--foreground-muted)]">
        {formatCurrency(client.expectedTransactionAmount)}
      </td>
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {reviewer.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11.5px] text-[var(--foreground-muted)]">
            {reviewer.name.split(" ")[0]}
          </span>
        </div>
      </td>
      <td className="py-3 pr-3 text-[11.5px] text-[var(--foreground-subtle)] whitespace-nowrap tabular">
        {formatRelative(client.updatedAt)}
      </td>
      <td className="py-3 pr-6 text-right">
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--primary)] opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
        >
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </motion.tr>
  );
}
