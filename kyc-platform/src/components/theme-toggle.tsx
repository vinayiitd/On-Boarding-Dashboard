"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

/**
 * Segmented control for switching between light, dark, and system themes.
 * Displayed in the topbar.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: { value: "light" | "dark" | "system"; icon: React.ElementType; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "system", icon: Monitor, label: "System" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5">
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={`${label} theme`}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
