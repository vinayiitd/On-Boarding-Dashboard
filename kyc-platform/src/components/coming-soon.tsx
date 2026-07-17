import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Consistent "coming soon" placeholder used for surfaces on the roadmap.
 * These still feel intentional rather than empty.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="gradient-ring mt-8 relative overflow-hidden rounded-2xl bg-[var(--surface)] p-8 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at 15% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 60%), radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 dot-bg radial-fade opacity-40"
        />
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[0_10px_28px_-8px_var(--primary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-6 font-display text-[26px] font-medium leading-tight tracking-tight">
            Sentinel is shipping this next
          </p>
          <p className="mt-2 text-[14px] text-[var(--foreground-muted)] max-w-md leading-relaxed">
            The core onboarding flow is fully interactive today. This surface is
            being polished for the next release.
          </p>
          <ul className="mt-6 grid gap-2.5 max-w-md">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-[13.5px] text-[var(--foreground-muted)]"
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                {b}
              </li>
            ))}
          </ul>
          <Button className="mt-8" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
