import { cn } from "@/lib/utils";

const steps = ["Client details", "Documents", "AI analysis", "Report"];

/**
 * Shared onboarding step indicator so all four flow screens
 * feel like a single guided journey.
 */
export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <ol className="flex items-center gap-2">
        {steps.map((label, i) => {
          const idx = i + 1;
          const state = idx < current ? "done" : idx === current ? "current" : "upcoming";
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                    state === "current"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : state === "done"
                        ? "bg-[color-mix(in_srgb,var(--success)_20%,var(--surface))] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]"
                        : "bg-[var(--surface-muted)] text-[var(--foreground-subtle)]",
                  )}
                >
                  {state === "done" ? "✓" : idx}
                </span>
                <span
                  className={cn(
                    "text-sm hidden sm:inline",
                    state === "current"
                      ? "text-[var(--foreground)] font-medium"
                      : "text-[var(--foreground-muted)]",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 ? (
                <div
                  className={cn(
                    "flex-1 h-px",
                    idx < current
                      ? "bg-[color-mix(in_srgb,var(--success)_60%,var(--border))]"
                      : "bg-[var(--border)]",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
