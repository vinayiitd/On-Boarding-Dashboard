"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  FileSearch,
  LayoutDashboard,
  LifeBuoy,
  Plus,
  Settings,
  ShieldCheck,
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
        "group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r bg-[var(--primary)]" />
      ) : null}
      <Icon
        className={cn(
          "h-4 w-4 transition-colors",
          active ? "text-[var(--primary)]" : "text-[var(--foreground-subtle)] group-hover:text-[var(--foreground)]",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <Badge variant="brand" size="sm">
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
        "sticky top-0 h-dvh w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/60",
        "backdrop-blur-sm",
      )}
    >
      <div className="flex h-16 items-center gap-2 px-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        <nav className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Workspace
          </p>
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <nav className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Account
          </p>
          {secondaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-auto">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-[var(--border)] p-4",
              "bg-gradient-to-br from-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] to-[color-mix(in_srgb,var(--accent)_12%,var(--surface))]",
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              <p className="text-sm font-semibold">AI copilot</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--foreground-muted)]">
              Sentinel reads every document you upload and drafts a compliance decision in under 4 seconds.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--foreground-muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
              AUSTRAC-ready
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
