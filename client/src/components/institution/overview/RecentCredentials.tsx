import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { Panel, Unavailable } from "./MetricTile";
import { CredentialStatusBadge, credentialState } from "@/components/institution/CredentialStatusBadge";

export function RecentCredentials() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/certificates/institution", "recent"],
    queryFn: () => api.getCertificates({ limit: 5, sortBy: "issuedAt", sortDir: "desc" }),
    staleTime: 30_000,
  });
  const rows: any[] = (data as any)?.certificates ?? [];

  return (
    <Panel
      title="Recently issued"
      description="The latest credentials signed by your institution."
      testId="recent-credentials-panel"
      action={<Link to="/institution/certificates" className="text-xs font-semibold text-primary hover:underline">View all</Link>}
    >
      {isLoading ? <Skeleton className="h-24 w-full" /> : isError ? (
        <Unavailable message="Credentials could not be loaded." />
      ) : rows.length === 0 ? (
        <Unavailable message="No credentials issued yet." />
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {rows.map((c) => (
            <li key={c.id}>
              <Link to={`/institution/credentials/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-2 px-2 rounded-lg" data-testid={`recent-credential-${c.id}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{c.studentName ?? "Unnamed recipient"}</p>
                  <p className="text-xs text-neutral-500 truncate">{c.courseName} · {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}</p>
                </div>
                <CredentialStatusBadge state={credentialState(c)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
