import { cn } from "@/lib/utils";

/**
 * Keyboard shortcut chip, styled like Linear/Notion.
 */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[6px]",
        "border border-[var(--border)] bg-[var(--surface-muted)] px-1",
        "text-[10.5px] font-medium text-[var(--foreground-subtle)] leading-none",
        "shadow-[inset_0_-1px_0_var(--border)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
