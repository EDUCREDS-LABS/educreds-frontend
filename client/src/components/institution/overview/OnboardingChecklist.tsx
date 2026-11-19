import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupStep {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  href?: string;
  action?: string;
}

export function OnboardingChecklist({ steps }: { steps: SetupStep[] }) {
  const completed = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  if (!next) return null;

  return (
    <section className="rounded-2xl border border-primary/20 bg-white dark:bg-neutral-900 p-6" data-testid="onboarding-checklist" aria-label="Institution setup">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Finish setting up your institution</h2>
          <p className="text-sm text-neutral-500">{completed} of {steps.length} steps complete. Each step is checked against your live account.</p>
        </div>
        <div className="h-2 w-full sm:w-48 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.id}
            data-testid={`onboarding-step-${s.id}`}
            data-done={s.done}
            className={cn(
              "flex gap-3 rounded-xl border p-3",
              s.id === next.id ? "border-primary/40 bg-primary/5" : "border-neutral-100 dark:border-neutral-800",
            )}
          >
            {s.done
              ? <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              : <Circle className="size-5 text-neutral-300 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className={cn("text-sm font-medium", s.done ? "text-neutral-500 line-through decoration-neutral-300" : "text-neutral-900 dark:text-neutral-100")}>{s.title}</p>
              <p className="text-xs text-neutral-500">{s.detail}</p>
              {!s.done && s.href && (
                <Link to={s.href} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" data-testid={`onboarding-action-${s.id}`}>
                  {s.action ?? "Continue"} <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
