import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Phase B.3 — Students table (Identity module).
 *
 * Enterprise-style huge table of credential holders: search, name, wallet,
 * status, claims, actions. Reuses the existing institution certificates list
 * (real data, no new backend endpoint). Each row links to the recipient's
 * public identity page.
 */
export function StudentsTable() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["/api/certificates/institution", "students", search],
    queryFn: () => api.getCertificates({ limit: 50, search: search || undefined }),
  });

  const list: any[] = Array.isArray(data)
    ? data
    : (data as any)?.certificates ?? (data as any)?.data ?? [];

  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500">
              Students
            </h2>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-3 pr-4">Student</th>
                <th className="py-3 pr-4">Wallet</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Claims</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="py-8 text-center text-neutral-400">Loading…</td></tr>
              )}
              {!isLoading && list.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-neutral-400">No students found.</td></tr>
              )}
              {!isLoading && list.map((c: any, i: number) => (
                <tr key={c.id ?? i} className="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-3 pr-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    {c.studentName ?? "Unknown Student"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-neutral-500">
                    {c.walletAddress ? `${String(c.walletAddress).slice(0, 6)}…${String(c.walletAddress).slice(-4)}` : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={c.status === "revoked" ? "destructive" : "default"} className="capitalize">
                      {c.status ?? "issued"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-neutral-500">—</td>
                  <td className="py-3 pr-4 text-right">
                    <Button asChild variant="outline" size="sm" className="rounded-lg">
                      <Link to={`/identity/${c.eduCredsId ?? ""}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
