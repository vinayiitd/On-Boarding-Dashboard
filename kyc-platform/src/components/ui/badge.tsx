import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none whitespace-nowrap tracking-tight",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--foreground)]",
        outline:
          "bg-transparent border-[var(--border-strong)] text-[var(--foreground)]",
        brand:
          "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] border-[color-mix(in_srgb,var(--primary)_28%,transparent)] text-[var(--primary)]",
        success:
          "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] border-[color-mix(in_srgb,var(--success)_30%,transparent)] text-[color-mix(in_srgb,var(--success)_75%,var(--foreground))]",
        warning:
          "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] border-[color-mix(in_srgb,var(--warning)_35%,transparent)] text-[color-mix(in_srgb,var(--warning)_80%,var(--foreground))]",
        danger:
          "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] border-[color-mix(in_srgb,var(--danger)_30%,transparent)] text-[color-mix(in_srgb,var(--danger)_75%,var(--foreground))]",
        accent:
          "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))]",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { badgeVariants };
