import { Link } from "react-router-dom";
import { Panel, Unavailable } from "./MetricTile";

export interface PipelineSummary {
  total: number;
  byStatus: Record<string, number>;
  recentFailures?: { id: string; error?: string }[];
}

const STATES = [
  { key: "active",  label: "Active",           hint: "Issued and anchored. Verifies as valid.",               color: "bg-emerald-500" },
  { key: "pending", label: "Pending anchoring", hint: "Issued and signed; blockchain anchoring is queued.",    color: "bg-amber-400" },
  { key: "minting", label: "Anchoring",        hint: "Anchoring transaction in progress.",                    color: "bg-blue-500" },
  { key: "failed",  label: "Anchoring failed", hint: "Needs attention. Retry from the credential detail.",    color: "bg-red-500" },
  { key: "revoked", label: "Revoked",          hint: "Withdrawn by your institution. Verifies as revoked.",   color: "bg-neutral-400" },
];

export function LifecyclePanel({ data, error }: { data?: PipelineSummary; error?: boolean }) {
  const total = data?.total ?? 0;
  return (
    <Panel
      title="Credential lifecycle"
      description="Current state of every credential your institution has issued."
      testId="lifecycle-panel"
      action={<Link to="/institution/certificates" className="text-xs font-semibold text-primary hover:underline">Manage</Link>}
    >
      {error ? <Unavailable message="Lifecycle data could not be loaded from the credential service." /> : (
        <>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4" aria-hidden>
            {total > 0 && STATES.map((s) => {
              const n = data?.byStatus?.[s.key] ?? 0;
              return n > 0 ? <div key={s.key} className={s.color} style={{ width: `${(n / total) * 100}%` }} /> : null;
            })}
          </div>
          <ul className="space-y-2">
            {STATES.map((s) => (
              <li key={s.key} className="flex items-center justify-between text-sm" title={s.hint}>
                <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className={`size-2 rounded-full ${s.color}`} />{s.label}
                </span>
                <span className="font-medium tabular-nums" data-testid={`lifecycle-count-${s.key}`}>{data?.byStatus?.[s.key] ?? 0}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-neutral-400 mt-4">
            Frozen / suspended credentials are not yet supported by the credential service.
          </p>
        </>
      )}
    </Panel>
  );
}
