import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb {
  href?: string;
  label: string;
}

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header used across every screen. Handles breadcrumbs,
 * eyebrow, title, description, and trailing action buttons.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {breadcrumbs && breadcrumbs.length ? (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-[var(--foreground-subtle)]"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-[var(--foreground)] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--foreground-muted)]">{crumb.label}</span>
              )}
              {i < breadcrumbs.length - 1 ? (
                <ChevronRight className="h-3 w-3" />
              ) : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col-reverse gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--primary)]">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-[34px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--foreground-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
