/**
 * Student Dashboard — authenticated home for the student workspace.
 * Redirects to /student/login if not authenticated as a student.
 */

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { getStudentToken } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award, Share2, Eye, Wallet, LayoutDashboard, User,
  ArrowRight, GraduationCap, Shield, Activity,
} from "lucide-react";

const CERT_API = API_CONFIG.CERT;

interface StudentMe {
  id: string;
  email: string;
  name: string;
  did?: string;
  walletAddress?: string;
  totalCredentials: number;
  credentialsCount?: number;
  sharedLinks: number;
  totalViews: number;
}

interface Credential {
  id: string;
  courseName: string;
  institutionName?: string;
  issuedAt?: string;
  grade?: string;
  status?: string;
}

export default function StudentDashboardPage() {
  const { user, isLoading: authLoading, authType } = useAuth();
  const navigate = useNavigate();

  // Guard: redirect if not authenticated as student
  useEffect(() => {
    if (authLoading) return;
    if (!user || authType !== AuthType.STUDENT) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, authType, navigate]);

  const token = getStudentToken();

  // Fetch student profile + summary
  const { data: me, isLoading: meLoading } = useQuery<StudentMe>({
    queryKey: ["student-me"],
    queryFn: async () => {
      const res = await fetch(`${CERT_API}/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!token && !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent credentials (for preview)
  const { data: credsData, isLoading: credsLoading } = useQuery<{ certificates: Credential[] }>({
    queryKey: ["student-credentials-preview", user?.email],
    queryFn: async () => {
      if (!user?.email) throw new Error("No email");
      const res = await fetch(
        `${CERT_API}/student/credentials`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load credentials");
      const data = await res.json();
      // /student/credentials returns a plain array; normalise to { certificates: [] }
      return { certificates: Array.isArray(data) ? data : (data?.certificates ?? []) };
    },
    enabled: !!token && !!user,
    staleTime: 2 * 60 * 1000,
  });

  if (authLoading) return null;
  if (!user) return null;

  const recentCredentials = (credsData?.certificates ?? []).slice(0, 3);
  const displayName = me?.name || user.name || user.email;

  const summaryCards = [
    { label: "Total Credentials", value: me?.credentialsCount ?? me?.totalCredentials ?? 0, icon: Award, color: "text-blue-600" },
    { label: "Shared Links", value: me?.sharedLinks ?? 0, icon: Share2, color: "text-green-600" },
    { label: "Total Views", value: me?.totalViews ?? 0, icon: Eye, color: "text-purple-600" },
  ];

  const quickActions = [
    { label: "Share a Credential", icon: Share2, path: "/student/credentials", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "View My Wallet", icon: Wallet, path: "/student/credentials", color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Verification Activity", icon: Activity, path: "/student/activity", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "My Identity", icon: User, path: "/student/identity", color: "bg-orange-50 text-orange-700 border-orange-200" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="size-5 text-neutral-500" />
            <span className="text-sm text-neutral-500 font-medium">Student Dashboard</span>
          </div>
          {meLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-bold">Welcome back, {displayName.split(" ")[0]} 👋</h1>
          )}
          {me?.did && (
            <p className="text-xs text-neutral-400 font-mono mt-1 truncate max-w-sm">{me.did}</p>
          )}
        </div>
        <Badge variant="secondary" className="gap-1">
          <GraduationCap className="size-3" /> Student
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-neutral-100 ${card.color}`}>
                <card.icon className="size-5" />
              </div>
              <div>
                {meLoading ? (
                  <Skeleton className="h-7 w-10 mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
                <p className="text-sm text-neutral-500">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Credentials */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="size-4" /> Recent Credentials
          </CardTitle>
          <Link to="/student/credentials">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {credsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentCredentials.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <Shield className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No credentials yet. Your institution will issue credentials to this account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCredentials.map((cred) => (
                <Link
                  key={cred.id}
                  to="/student/credentials"
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <Award className="size-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cred.courseName}</p>
                      {cred.institutionName && (
                        <p className="text-xs text-neutral-500">{cred.institutionName}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={cred.status === "revoked" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {cred.status === "revoked" ? "Revoked" : "Active"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity ${action.color}`}>
                <action.icon className="size-5" />
                <span className="text-xs font-medium text-center">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
