import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Client details", key: "client" },
  { label: "Documents", key: "docs" },
  { label: "Verify identity", key: "verify" },
  { label: "Report", key: "report" },
];

/**
 * Shared onboarding step indicator so all four flow screens feel
 * like a single guided journey. Connector fills using a real
 * gradient; the current step gets a soft glow.
 */
export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="surface-card rounded-2xl p-3">
      <ol className="relative flex items-center gap-3">
        {steps.map((step, i) => {
          const idx = i + 1;
          const state = idx < current ? "done" : idx === current ? "current" : "upcoming";
          return (
            <li key={step.key} className="flex flex-1 items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                      state === "current" &&
                        "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_18%,transparent)]",
                      state === "done" &&
                        "bg-[color-mix(in_srgb,var(--success)_22%,var(--surface))] text-[color-mix(in_srgb,var(--success)_80%,var(--foreground))]",
                      state === "upcoming" &&
                        "bg-[var(--surface-muted)] text-[var(--foreground-subtle)] ring-1 ring-inset ring-[var(--border)]",
                    )}
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                    ) : (
                      idx
                    )}
                  </span>
                  {state === "current" ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full ring-2 ring-[var(--primary)]/30 animate-[pulseSlow_2s_infinite]"
                    />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "hidden sm:inline text-[13px] tracking-tight transition-colors",
                    state === "current"
                      ? "font-semibold text-[var(--foreground)]"
                      : state === "done"
                        ? "text-[var(--foreground-muted)]"
                        : "text-[var(--foreground-subtle)]",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 ? (
                <div className="relative flex-1 h-[2px] overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                    )}
                    style={{
                      width:
                        idx < current
                          ? "100%"
                          : idx === current
                            ? "50%"
                            : "0%",
                      background:
                        "linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--accent) 90%, var(--primary)))",
                    }}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
