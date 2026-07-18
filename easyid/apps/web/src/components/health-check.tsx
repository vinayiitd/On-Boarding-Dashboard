"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiClientError } from "@easyid/sdk";
import { Card, CardContent } from "@easyid/ui";
import { api } from "@/lib/api";

/**
 * Small end-to-end verification: browser → SDK → API → back. If this card
 * shows "healthy" the whole stack is wired.
 */
export function HealthCheck() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => api.health.get({ signal }),
  });

  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-between gap-4 pt-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
            API healthcheck
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            <span className="font-mono">GET /api/v1/health</span>
          </p>
        </div>
        <StatusPill query={query} />
      </CardContent>
    </Card>
  );
}

function StatusPill({
  query,
}: {
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof api.health.get>>>>;
}) {
  if (query.isLoading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--foreground-subtle)]" />
        Checking…
      </span>
    );
  }
  if (query.isError) {
    const message =
      query.error instanceof ApiClientError
        ? `${query.error.code}: ${query.error.message}`
        : "Unreachable";
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-1 text-xs font-medium text-[color-mix(in_srgb,var(--danger)_75%,var(--foreground))]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
        {message}
      </span>
    );
  }

  const status = query.data?.status ?? "unknown";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--success)_30%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-1 text-xs font-medium text-[color-mix(in_srgb,var(--success)_75%,var(--foreground))]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
      {status} · v{query.data?.version}
    </span>
  );
}
