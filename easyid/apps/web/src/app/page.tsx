import { HealthCheck } from "@/components/health-check";

/**
 * Root page. Deliberately minimal — this is the foundation, not a product.
 * Verifies the entire stack end-to-end by fetching `/api/v1/health` through
 * the SDK.
 */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
          easyID · v0.1.0
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Compliance Matters.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
          Production foundation for the easyID compliance platform. Business features land in
          follow-up iterations.
        </p>
      </div>
      <HealthCheck />
    </main>
  );
}
