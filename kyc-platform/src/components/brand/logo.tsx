import { cn } from "@/lib/utils";

/**
 * Sentinel wordmark + shield.
 * Uses currentColor for the S/gradient so it inherits from the surrounding text.
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
        className="relative inline-flex items-center justify-center rounded-[10px] text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.4)]"
        style={{
          width: size,
          height: size,
          background:
            "conic-gradient(from 220deg at 50% 50%, #2563EB, #14B8A6, #2563EB)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[55%] w-[55%]"
          aria-hidden
        >
          <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
          Sentinel
        </span>
      ) : null}
    </div>
  );
}
