/**
 * Developer Portal — API Usage
 * Lifetime M2M request counts from institution API keys.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { developerPortalApi } from "@/lib/developerPortalApi";
import { cn } from "@/lib/utils";
import { Activity, Zap, Clock, KeyRound } from "lucide-react";
import { format } from "date-fns";

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  sub?: string;
  progress?: number;
}

function StatCard({ label, value, icon: Icon, sub, progress }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-neutral-400">{label}</p>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
            <Icon className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          {value != null ? (typeof value === "number" ? value.toLocaleString() : value) : "—"}
        </p>
        {sub && <p className="text-xs text-neutral-400">{sub}</p>}
        {progress != null && (
          <Progress
            value={progress}
            className={cn(
              "h-2 rounded-full",
              progress > 90 ? "[&>div]:bg-red-500" : progress > 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500",
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function ApiUsagePage() {
  const { data: usage, isLoading, isError, refetch } = useQuery({
    queryKey: ["developer-usage"],
    queryFn: developerPortalApi.getUsage,
    retry: 1,
  });

  const { data: subData } = useQuery({
    queryKey: ["developer-subscription"],
    queryFn: developerPortalApi.getSubscriptionStatus,
    retry: 1,
  });

  const planName = (subData as any)?.plan ?? "—";
  const keys = usage?.keys ?? [];
  const maxKeyUsage = Math.max(0, ...keys.map((k) => k.usageCount));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 rounded-2xl">
          <Activity className="size-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">API Usage</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Lifetime M2M calls from your institution API keys. Errors and p99 latency stay blank until APM is wired.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">Current plan:</span>
        <Badge className="rounded-lg font-bold border-0 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
          {planName}
        </Badge>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-destructive font-medium">Could not load usage metrics.</p>
          <button type="button" className="text-xs font-bold underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            label="API Requests (lifetime)"
            value={usage?.requests ?? 0}
            icon={Activity}
            sub={usage?.lastUsedAt ? `Last used ${format(new Date(usage.lastUsedAt), "dd MMM yyyy HH:mm")}` : "No M2M traffic yet"}
          />
          <StatCard
            label="Active API Keys"
            value={usage?.activeKeys ?? 0}
            icon={KeyRound}
            sub={`${usage?.portalKeys ?? 0} portal key(s) registered`}
          />
          <StatCard
            label="Peak Rate Limit"
            value={
              usage?.rateLimit != null
                ? `${usage.rateLimit} / ${usage.rateLimitWindowSeconds ?? 60}s`
                : null
            }
            icon={Zap}
            sub="Highest limit among active M2M keys"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard label="Errors" value={usage?.errors} icon={Clock} sub="Not tracked yet (APM)" />
        <StatCard
          label="Latency p99"
          value={usage?.latencyP99Ms == null ? null : `${usage.latencyP99Ms} ms`}
          icon={Clock}
          sub="Not tracked yet (APM)"
        />
      </div>

      {keys.length > 0 && (
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-neutral-400">
              Calls by API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keys
              .slice()
              .sort((a, b) => b.usageCount - a.usageCount)
              .map((key) => {
                const pct = maxKeyUsage > 0 ? Math.round((key.usageCount / maxKeyUsage) * 100) : 0;
                return (
                  <div key={key.clientId} className="space-y-1">
                    <div className="flex justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-700 dark:text-neutral-300 truncate">{key.name}</p>
                        <code className="font-mono text-neutral-500 text-[10px]">{key.clientId}</code>
                      </div>
                      <span className="font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                        {key.usageCount.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 rounded-full" />
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (usage?.requests ?? 0) === 0 && keys.length === 0 && (
        <div className="text-center py-12">
          <Clock className="size-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">No M2M API key usage recorded yet.</p>
        </div>
      )}
    </div>
  );
}
