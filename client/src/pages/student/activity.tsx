/**
 * Student Activity Page — verification activity log (who verified the student's credentials).
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { getStudentToken } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Activity, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

const CERT_API = API_CONFIG.CERT;

interface VerificationEvent {
  id: string;
  verifiedAt?: string;
  verifierName?: string;
  verifierEmail?: string;
  credentialName?: string;
  purpose?: string;
  status?: "valid" | "invalid" | "revoked";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM d, yyyy HH:mm");
  } catch {
    return dateStr;
  }
}

function statusVariant(status?: string) {
  if (status === "valid") return "secondary";
  if (status === "revoked") return "destructive";
  return "outline";
}

export default function StudentActivityPage() {
  const { user, isLoading: authLoading, authType } = useAuth();
  const navigate = useNavigate();

  // Guard
  useEffect(() => {
    if (authLoading) return;
    if (!user || authType !== AuthType.STUDENT) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, authType, navigate]);

  const token = getStudentToken();

  const { data, isLoading, error } = useQuery<{ verifications: VerificationEvent[] }>({
    queryKey: ["student-activity", user?.id],
    queryFn: async () => {
      const res = await fetch(`${CERT_API}/api/student/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 404) return { verifications: [] };
        throw new Error("Failed to load verification activity");
      }
      return res.json();
    },
    enabled: !!token && !!user,
    staleTime: 2 * 60 * 1000,
  });

  const events = data?.verifications ?? [];

  if (authLoading || !user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="size-5 text-neutral-500" />
          <span className="text-sm text-neutral-500 font-medium">Verification Activity</span>
        </div>
        <h1 className="text-2xl font-bold">Verification Activity</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Who has verified your credentials and when.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4" /> Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-sm">
              Failed to load activity. Please try again.
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <Shield className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">No verification activity yet</p>
              <p className="text-sm">When someone verifies your credentials, it will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">Date</th>
                      <th className="pb-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">Verifier</th>
                      <th className="pb-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">Credential</th>
                      <th className="pb-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">Purpose</th>
                      <th className="pb-3 font-medium text-neutral-500 text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                        <td className="py-3 text-xs text-neutral-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatDate(event.verifiedAt)}
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="font-medium">{event.verifierName ?? "—"}</p>
                          {event.verifierEmail && (
                            <p className="text-xs text-neutral-400">{event.verifierEmail}</p>
                          )}
                        </td>
                        <td className="py-3 text-sm">{event.credentialName ?? "—"}</td>
                        <td className="py-3 text-sm text-neutral-500">{event.purpose ?? "—"}</td>
                        <td className="py-3">
                          <Badge variant={statusVariant(event.status)} className="text-xs capitalize">
                            {event.status ?? "verified"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="sm:hidden space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{event.verifierName ?? "Unknown Verifier"}</p>
                      <Badge variant={statusVariant(event.status)} className="text-xs capitalize">
                        {event.status ?? "verified"}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500">{event.credentialName ?? "Credential"}</p>
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Calendar className="size-3" />
                      {formatDate(event.verifiedAt)}
                    </div>
                    {event.purpose && (
                      <p className="text-xs text-neutral-400">Purpose: {event.purpose}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
