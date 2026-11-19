/**
 * Institution Analytics — Real data from /api/institutions/me/analytics
 *
 * Shows: stat cards, 6-month issuance trend, top programmes, verification count.
 * Loading skeletons while fetching. Graceful empty state.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Award, TrendingUp, TrendingDown, CheckCircle, XCircle,
  ShieldCheck, BookOpen, BarChart3, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalCredentials: number;
  issuedThisMonth: number;
  issuedThisWeek: number;
  activeCredentials: number;
  revokedCount: number;
  verificationCount: number;
  trend: { month: string; count: number }[];
  topProgrammes: { name: string; count: number }[];
}

type Period = "30d" | "90d" | "6m" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "6m": "Last 6 Months",
  "all": "All Time",
};

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, icon, accent = "bg-neutral-100 dark:bg-neutral-800", loading }: StatCardProps) {
  return (
    <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900">
      <CardContent className="p-6">
        {loading ? (
          <>
            <Skeleton className="h-3 w-24 rounded-full mb-3" />
            <Skeleton className="h-8 w-16 rounded-full mb-2" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</p>
              <div className={cn("size-8 rounded-xl flex items-center justify-center", accent)}>
                {icon}
              </div>
            </div>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 leading-none">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-xs text-neutral-400 mt-2">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("6m");

  const { data, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["institution-analytics", period],
    queryFn: async () => {
      const res = await fetch(
        `${API_CONFIG.CERT}/api/institutions/me/analytics?period=${period}`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  const hasData = !isLoading && data != null;
  const noActivity = hasData && data.totalCredentials === 0 && data.trend.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Credential issuance and verification insights</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  period === p
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          loading={isLoading}
          label="Total Credentials"
          value={data?.totalCredentials ?? 0}
          sub="All time"
          icon={<Award className="size-4 text-blue-600" />}
          accent="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          loading={isLoading}
          label="Issued This Month"
          value={data?.issuedThisMonth ?? 0}
          sub="Current month"
          icon={<TrendingUp className="size-4 text-emerald-600" />}
          accent="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          loading={isLoading}
          label="Issued This Week"
          value={data?.issuedThisWeek ?? 0}
          sub="Last 7 days"
          icon={<BarChart3 className="size-4 text-violet-600" />}
          accent="bg-violet-50 dark:bg-violet-950/30"
        />
        <StatCard
          loading={isLoading}
          label="Active Credentials"
          value={data?.activeCredentials ?? 0}
          sub="Not revoked"
          icon={<CheckCircle className="size-4 text-emerald-600" />}
          accent="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          loading={isLoading}
          label="Revoked"
          value={data?.revokedCount ?? 0}
          sub="Invalidated"
          icon={<XCircle className="size-4 text-red-500" />}
          accent="bg-red-50 dark:bg-red-950/30"
        />
        <StatCard
          loading={isLoading}
          label="Verifications"
          value={data?.verificationCount ?? 0}
          sub="Total checks on your creds"
          icon={<ShieldCheck className="size-4 text-sky-600" />}
          accent="bg-sky-50 dark:bg-sky-950/30"
        />
      </div>

      {/* No activity empty state */}
      {noActivity && (
        <div className="text-center py-16 space-y-3">
          <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
            <BarChart3 className="size-8 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="font-bold text-neutral-500">No data yet</p>
          <p className="text-sm text-neutral-400">Issue your first credential to see analytics here.</p>
        </div>
      )}

      {/* 6-month trend chart */}
      {!noActivity && (
        <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-black text-neutral-800 dark:text-neutral-200">
              Issuance Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-48 rounded-2xl" />
            ) : !data?.trend || data.trend.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-neutral-400">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-neutral-400"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-neutral-400"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [v.toLocaleString(), "Issued"]}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top programmes */}
      {!noActivity && (
        <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <BookOpen className="size-4" /> Top Programmes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 rounded-xl" />)
            ) : !data?.topProgrammes || data.topProgrammes.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">No programme data yet</p>
            ) : (
              (() => {
                const max = Math.max(...data.topProgrammes.map((p) => p.count), 1);
                return data.topProgrammes.map((prog) => (
                  <div key={prog.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[70%]">
                        {prog.name}
                      </span>
                      <Badge className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-0 rounded-full">
                        {prog.count.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${(prog.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ));
              })()
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
