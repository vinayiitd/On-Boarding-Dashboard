"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpenCheck,
  ChevronsUpDown,
  FileSearch,
  LayoutDashboard,
  LifeBuoy,
  Plus,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  end?: boolean;
}

const primaryNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/clients/new", label: "New client", icon: Plus },
  { href: "/reviews", label: "Reviews", icon: FileSearch, badge: "3" },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/policies", label: "Policies", icon: BookOpenCheck },
];

const secondaryNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/support", label: "Help & support", icon: LifeBuoy },
];

function isActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href, item.end);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-[13.5px] font-medium transition-colors",
        active
          ? "text-[var(--foreground)]"
          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
      )}
    >
      {active ? (
        <motion.span
          layoutId="side-nav-active"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="absolute inset-0 rounded-[10px] bg-[var(--surface-muted)]"
        />
      ) : (
        <span className="absolute inset-0 rounded-[10px] transition-colors group-hover:bg-[var(--surface-muted)]/70" />
      )}
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Icon
          className={cn(
            "h-[15px] w-[15px] transition-colors",
            active
              ? "text-[var(--primary)]"
              : "text-[var(--foreground-subtle)] group-hover:text-[var(--foreground)]",
          )}
          strokeWidth={active ? 2.25 : 1.85}
        />
      </span>
      <span className="relative flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <Badge variant="brand" size="sm" className="relative">
          {item.badge}
        </Badge>
      ) : null}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col",
        "sticky top-0 h-dvh w-[248px] shrink-0 border-r border-[var(--border)]",
        "bg-[color-mix(in_srgb,var(--surface)_60%,var(--background))] backdrop-blur-sm",
      )}
    >
      {/* Workspace switcher */}
      <div className="flex h-16 items-center gap-2 px-3 border-b border-[var(--border)]">
        <button
          type="button"
          className={cn(
            "group flex flex-1 items-center gap-2.5 rounded-[10px] px-2 py-1.5",
            "transition-colors hover:bg-[var(--surface-muted)]",
          )}
        >
          <Logo size={26} showWordmark={false} />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[13.5px] font-semibold leading-tight">
              Sentinel
            </p>
            <p className="truncate text-[11px] text-[var(--foreground-subtle)] leading-tight">
              Whitmore & Partners
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--foreground-subtle)] group-hover:text-[var(--foreground)]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        <nav className="flex flex-col gap-0.5">
          <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--foreground-subtle)]">
            Workspace
          </p>
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <nav className="flex flex-col gap-0.5">
          <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--foreground-subtle)]">
            Account
          </p>
          {secondaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Live AI copilot promo */}
        <div className="mt-auto">
          <div
            className={cn(
              "gradient-ring relative overflow-hidden rounded-2xl p-4",
              "bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))]",
            )}
          >
            <div className="flex items-center gap-2">
              <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-[0_2px_8px_-2px_var(--primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface)]" />
              </div>
              <p className="text-[13px] font-semibold">Sentinel is live</p>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--foreground-muted)]">
              Watching every uploaded document. Averages a decision in 3.8s.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 px-2 py-1 font-mono text-[10px] text-[var(--foreground-subtle)]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-[pulseSlow_2s_infinite]" />
                AUSTRAC ready
              </span>
              <span>v1.2</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
