import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Minus } from "lucide-react";

/**
 * Phase B.4 / C — Permission matrix (RBAC visualization).
 *
 * Reads the role × capability matrix from the backend RBAC service
 * (`/api/auth/rbac/matrix`) — no longer mocked. Rendered as a grid (roles ×
 * capabilities) so administrators can audit access at a glance.
 */
export function PermissionMatrix() {
  const { data, isLoading } = useQuery({
    queryKey: ["rbac-matrix"],
    queryFn: () => api.getRbacMatrix(),
  });

  const roles: string[] = data?.roles ?? [];
  const capabilities: string[] = data?.capabilities ?? [];
  const matrix = data?.matrix ?? [];

  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500 mb-4">
          Role &amp; Capability Matrix
        </h2>
        {isLoading && <p className="text-sm text-neutral-400 py-6">Loading permissions…</p>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-xs font-black uppercase tracking-widest text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">
                    Role
                  </th>
                  {capabilities.map((c) => (
                    <th key={c} className="text-center py-2 px-2 text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => {
                  const row = matrix.find((m: any) => m.role === role);
                  return (
                    <tr key={role} className="border-t border-neutral-100 dark:border-neutral-800/60">
                      <td className="py-2 pr-4 font-semibold text-neutral-900 dark:text-neutral-100 sticky left-0 bg-white dark:bg-neutral-900">
                        {role}
                      </td>
                      {capabilities.map((c) => {
                        const granted = Boolean(row?.grants?.[c]);
                        return (
                          <td key={c} className="text-center py-2 px-2">
                            {granted ? (
                              <Check className="size-4 text-[#16A34A] mx-auto" />
                            ) : (
                              <Minus className="size-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
