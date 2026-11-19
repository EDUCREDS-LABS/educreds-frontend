import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

/** A metric with an explicit definition. Shows "—" when the backend has no value. */
export function MetricTile({ label, value, definition, href, loading, tone, testId }: {
  label: string;
  value: number | string | null | undefined;
  definition: string;
  href?: string;
  loading?: boolean;
  tone?: "warn" | "bad";
  testId: string;
}) {
  const shown = value == null || value === "" ? "—" : typeof value === "number" ? value.toLocaleString() : value;
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        {label}
        <span title={definition} aria-label={definition}><Info className="size-3 text-neutral-400" /></span>
      </div>
      {loading ? <Skeleton className="h-8 w-16 mt-2" /> : (
        <p
          data-testid={testId}
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-neutral-900 dark:text-neutral-100",
          )}
        >
          {shown}
        </p>
      )}
    </>
  );
  const cls = "block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4";
  return href
    ? <Link to={href} className={cn(cls, "hover:border-primary/40 transition-colors")}>{body}</Link>
    : <div className={cls}>{body}</div>;
}

export function Panel({ title, description, action, children, testId }: {
  title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; testId?: string;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5" data-testid={testId}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Unavailable({ message }: { message: string }) {
  return <p className="text-sm text-neutral-500 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-3">{message}</p>;
}
