"use client";

import Link from "next/link";
import { Bell, Command, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Persistent top bar shown on every page. Search, notifications, primary CTA.
 */
export function Topbar() {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 md:px-6 lg:px-8",
        "backdrop-blur",
      )}
    >
      <Link href="/" className="lg:hidden">
        <Logo showWordmark={false} size={30} />
      </Link>

      <div className="flex flex-1 items-center gap-2 max-w-xl">
        <label
          className={cn(
            "group relative flex flex-1 items-center gap-2 rounded-[12px] border border-[var(--border)]",
            "bg-[var(--surface)] px-3.5 h-10 transition-colors focus-within:border-[var(--primary)]",
            "focus-within:ring-4 focus-within:ring-[var(--ring)]/20",
          )}
        >
          <Search className="h-4 w-4 text-[var(--foreground-subtle)]" />
          <input
            type="text"
            placeholder="Search clients, documents, or ask AI…"
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-subtle)]">
            <Command className="h-3 w-3" />K
          </kbd>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="iconSm" aria-label="Notifications">
          <span className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--background)]" />
          </span>
        </Button>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New client</span>
          </Link>
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
