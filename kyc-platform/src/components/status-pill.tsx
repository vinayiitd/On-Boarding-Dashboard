import type { ClientStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<ClientStatus, {
  label: string;
  variant: "brand" | "warning" | "success" | "danger" | "default";
  dot: string;
}> = {
  draft: { label: "Draft", variant: "default", dot: "bg-[var(--foreground-subtle)]" },
  collecting: { label: "Collecting docs", variant: "brand", dot: "bg-[var(--primary)]" },
  in_review: { label: "In review", variant: "warning", dot: "bg-[var(--warning)]" },
  ready: { label: "Ready for review", variant: "brand", dot: "bg-[var(--primary)]" },
  approved: { label: "Approved", variant: "success", dot: "bg-[var(--success)]" },
  escalated: { label: "Escalated", variant: "danger", dot: "bg-[var(--danger)]" },
};

export function StatusPill({
  status,
  className,
}: {
  status: ClientStatus;
  className?: string;
}) {
  const cfg = statusConfig[status];
  return (
    <Badge variant={cfg.variant} className={cn(className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}
