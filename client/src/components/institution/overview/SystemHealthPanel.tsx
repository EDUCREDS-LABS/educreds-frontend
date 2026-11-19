import { Panel, Unavailable } from "./MetricTile";
import { cn } from "@/lib/utils";

type Status = "healthy" | "degraded" | "down" | "unhealthy" | "n/a" | string;

export interface HealthStatus {
  overall?: Status;
  systemComponents?: Record<string, { status: Status; message?: string }>;
  institutionSpecific?: Record<string, { status: Status; lastSyncedAt?: string | null; lastSyncError?: string | null }>;
}

const LABELS: Record<string, string> = {
  database: "Credential records",
  trustAgent: "Trust analysis",
  connector: "SIS connector",
  blockchain: "Blockchain anchoring",
  webhook: "Webhook delivery",
};

const dot = (s: Status) =>
  s === "healthy" ? "bg-emerald-500" : s === "degraded" ? "bg-amber-500" : s === "n/a" ? "bg-neutral-300" : "bg-red-500";

export function SystemHealthPanel({ data, error }: { data?: HealthStatus; error?: boolean }) {
  const rows = [
    ...Object.entries(data?.systemComponents ?? {}),
    ...Object.entries(data?.institutionSpecific ?? {}),
  ];
  return (
    <Panel title="Service status" description="Reported live by the EduCreds platform for your institution." testId="system-health-panel">
      {error || !data ? <Unavailable message="Service status is unavailable right now." /> : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {rows.map(([key, v]) => (
            <li key={key} className="flex items-center justify-between py-2 text-sm" title={(v as any).message ?? (v as any).lastSyncError ?? ""}>
              <span className="text-neutral-700 dark:text-neutral-300">{LABELS[key] ?? key}</span>
              <span className="flex items-center gap-2 text-xs font-medium" data-testid={`health-${key}`}>
                <span className={cn("size-2 rounded-full", dot(v.status))} />
                {v.status === "n/a" ? "Not configured" : String(v.status).charAt(0).toUpperCase() + String(v.status).slice(1)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
