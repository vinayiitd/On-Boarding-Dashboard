import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-11 w-full rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)]",
      "px-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]",
      "transition-[box-shadow,border-color] duration-200",
      "focus:border-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--ring)]/25",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "file:mr-3 file:rounded file:border-0 file:bg-transparent file:text-sm file:font-medium",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)]",
      "px-3.5 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]",
      "transition-[box-shadow,border-color] duration-200 resize-y leading-relaxed",
      "focus:border-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--ring)]/25",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
