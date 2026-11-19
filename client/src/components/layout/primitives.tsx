import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shared layout primitives enforcing the EduCreds design system spacing scale.
 * Replaces ad-hoc padding across surfaces (Layout, ModernDashboard, landing,
 * institution pages) so vertical rhythm and max-width stay consistent.
 */

/** Max content width + horizontal gutters used app-wide. */
export const CONTENT_MAX = "max-w-7xl";
export const CONTENT_PX = "px-4 sm:px-6 lg:px-8";
export const CONTENT_GUTTER = `${CONTENT_MAX} mx-auto ${CONTENT_PX}`;
export const VERTICAL_RHYTHM = "space-y-6 lg:space-y-8";

export function ContentContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(CONTENT_GUTTER, className)}>{children}</div>;
}

export function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("space-y-4", className)}>{children}</section>;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-500 font-medium">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
