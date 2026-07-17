"use client";

import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import { Kbd } from "@/components/viz/kbd";
import { cn } from "@/lib/utils";

/**
 * Persistent top bar shown on every page. Sits inside a hairline strip so
 * the workspace feels grounded. Search reads like a spotlight/command bar.
 */
export function Topbar() {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3",
        "border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)]",
        "px-4 md:px-6 lg:px-8 backdrop-blur-md",
      )}
    >
      <Link href="/" className="lg:hidden">
        <Logo showWordmark={false} size={30} />
      </Link>

      <div className="flex flex-1 items-center gap-2 max-w-xl">
        <label
          className={cn(
            "group relative flex flex-1 items-center gap-2.5 rounded-[10px]",
            "border border-[var(--border)] bg-[var(--surface)] px-3 h-9",
            "shadow-[var(--shadow-soft)] transition-colors",
            "focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[var(--ring)]/25",
          )}
        >
          <Search
            className="h-[15px] w-[15px] text-[var(--foreground-subtle)]"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search clients, documents or ask Sentinel…"
            className="flex-1 bg-transparent text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none"
          />
          <span className="hidden items-center gap-0.5 sm:inline-flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="iconSm" aria-label="Notifications">
          <span className="relative">
            <Bell className="h-4 w-4" strokeWidth={2} />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--danger)] ring-2 ring-[var(--background)]" />
          </span>
        </Button>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/clients/new">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New client</span>
          </Link>
        </Button>
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-[11px]">AC</AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--success)] ring-2 ring-[var(--background)]"
            aria-label="Online"
          />
        </div>
      </div>
    </header>
  );
}
