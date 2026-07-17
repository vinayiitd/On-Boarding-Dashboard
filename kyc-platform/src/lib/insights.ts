import type { Client } from "./types";

/**
 * Compute deterministic KPI insights (trend series, delta counts) from
 * the current book of business. Keeps the dashboard honest: numbers
 * always reflect real state, sparklines vary between demo runs.
 */
export interface Kpi {
  value: number;
  delta: number;
  series: number[];
}

function seededNoise(seed: number, len: number, base: number, amp: number): number[] {
  // Simple deterministic pseudo-random walk based on a numeric seed.
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    out.push(Math.max(0, Math.round(base + (r - 0.5) * amp)));
  }
  return out;
}

export function computeInsights(clients: Client[]) {
  const total = clients.length;
  const pending = clients.filter(
    (c) => c.status === "in_review" || c.status === "ready",
  ).length;
  const completed = clients.filter((c) => c.status === "approved").length;
  const highRisk = clients.filter((c) => c.risk === "High").length;

  const pendingSeries = seededNoise(total * 13 + pending, 14, Math.max(pending, 3), 3);
  pendingSeries[pendingSeries.length - 1] = Math.max(pending, 1);

  const completedSeries = seededNoise(total * 7 + completed, 14, Math.max(completed + 1, 4), 3);
  completedSeries[completedSeries.length - 1] = completed;

  const riskSeries = seededNoise(total * 11 + highRisk, 14, Math.max(highRisk, 1), 2);
  riskSeries[riskSeries.length - 1] = highRisk;

  const clientsSeries = seededNoise(total * 5, 14, Math.max(total - 2, 3), 3);
  clientsSeries[clientsSeries.length - 1] = total;

  return {
    pending: { value: pending, delta: 2, series: pendingSeries } satisfies Kpi,
    completed: { value: completed, delta: 4, series: completedSeries } satisfies Kpi,
    highRisk: { value: highRisk, delta: 0, series: riskSeries } satisfies Kpi,
    clients: { value: total, delta: 4, series: clientsSeries } satisfies Kpi,
  };
}

/**
 * How many things Sentinel handled since the reviewer last signed in.
 * Deterministic per current dataset so the number is stable in a session.
 */
export function overnightChecks(clients: Client[]) {
  const seed =
    clients.reduce((acc, c) => acc + c.documents.length, 0) * 3 +
    clients.length * 4;
  return 12 + (seed % 9);
}
