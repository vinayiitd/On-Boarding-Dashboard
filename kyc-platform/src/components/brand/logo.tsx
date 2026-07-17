import { cn } from "@/lib/utils";

/**
 * Sentinel wordmark + shield.
 * The shield uses a soft conic gradient that reads distinct from the
 * primary CTA gradient — subtle, but this is what gives the mark identity.
 */
export function Logo({
  className,
  showWordmark = true,
  size = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-[9px] text-white",
          "shadow-[0_2px_10px_-2px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
        )}
        style={{
          width: size,
          height: size,
          background:
            "conic-gradient(from 210deg at 50% 50%, #2563EB, #4F7CFF, #14B8A6, #2563EB)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-[9px] opacity-70 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 55%)",
          }}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative h-[55%] w-[55%]"
          aria-hidden
        >
          <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "text-[17px] font-semibold tracking-tight text-[var(--foreground)]",
            "font-display",
          )}
        >
          Sentinel
        </span>
      ) : null}
    </div>
  );
}
