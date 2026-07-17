"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium select-none isolate overflow-hidden",
    "transition-[transform,background-color,box-shadow,color,border-color] duration-200",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.98] focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_1px_2px_rgba(15,23,42,0.12)] hover:brightness-[1.05]",
        subtle:
          "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--surface-muted))]",
        outline:
          "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
        ghost:
          "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
        destructive:
          "bg-[var(--danger)] text-[var(--danger-foreground)] hover:brightness-[1.05]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-[1.05]",
        success:
          "bg-[var(--success)] text-[var(--success-foreground)] hover:brightness-[1.05]",
        link:
          "text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[10px]",
        md: "h-10 px-4 text-sm rounded-[12px]",
        lg: "h-11 px-5 text-[15px] rounded-[14px]",
        xl: "h-12 px-6 text-base rounded-[14px]",
        icon: "h-10 w-10 rounded-[12px]",
        iconSm: "h-8 w-8 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
