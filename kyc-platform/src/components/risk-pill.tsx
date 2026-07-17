import type { RiskLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const riskConfig: Record<RiskLevel, {
  variant: "success" | "warning" | "danger";
  dot: string;
}> = {
  Low: { variant: "success", dot: "bg-[var(--success)]" },
  Medium: { variant: "warning", dot: "bg-[var(--warning)]" },
  High: { variant: "danger", dot: "bg-[var(--danger)]" },
};

export function RiskPill({
  risk,
  size = "md",
  className,
}: {
  risk: RiskLevel;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cfg = riskConfig[risk];
  return (
    <Badge variant={cfg.variant} size={size} className={cn(className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {risk} risk
    </Badge>
  );
}
