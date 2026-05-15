import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Activity, 
  Zap, 
  ShieldCheck,
  FileText,
  Globe,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';

interface UsageData {
  current: {
    certificates: number;
    apiCalls: number;
    storage: number;
    billingPeriod: string;
  };
  limits: {
    certificates: number;
    apiCalls: number;
  };
  percentageUsed: {
    certificates: number;
    apiCalls: number;
  };
}

interface UsageDashboardProps {
  compact?: boolean;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ compact = false }) => {
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['/api/subscription/usage'],
    queryFn: async () => {
      const data = await api.getSubscriptionUsage();
      return normalizeUsage(data?.usage ?? data);
    }
  });

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['/api/subscription/current'],
    queryFn: api.getCurrentSubscription
  });

  const normalizeUsage = (raw: any): UsageData | null => {
    if (!raw) return null;
    const certificates = Number(raw.certificatesIssued ?? raw.certificatesThisMonth ?? 0);
    const apiCalls = Number(raw.apiCallsMade ?? raw.apiCallsThisMonth ?? 0);
    const storage = Number(raw.storageUsedMb ?? 0);
    const limitsCertificates = Number(raw.certificateLimit ?? raw.limits?.certificates ?? -1);
    const limitsApiCalls = Number(raw.apiCallLimit ?? raw.limits?.apiCalls ?? -1);

    return {
      current: {
        certificates,
        apiCalls,
        storage,
        billingPeriod: raw.billingPeriod ?? raw.currentPeriodStart ?? "",
      },
      limits: {
        certificates: limitsCertificates,
        apiCalls: limitsApiCalls,
      },
      percentageUsed: {
        certificates: limitsCertificates === -1 ? 0 : Math.round((certificates / Math.max(limitsCertificates, 1)) * 100),
        apiCalls: limitsApiCalls === -1 ? 0 : Math.round((apiCalls / Math.max(limitsApiCalls, 1)) * 100),
      },
    };
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-primary';
  };

  if (usageLoading || subLoading) {
    return (
      <div className={cn("grid gap-6", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <Skeleton className="h-32 w-full rounded-[32px]" />
      </div>
    );
  }

  const usage = usageData;
  const subscription = (subData as any)?.subscription;

  if (!usage || !subscription) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[32px]">
        <Database className="size-10 mx-auto mb-4 text-neutral-300" />
        <p className="font-bold text-neutral-500 uppercase tracking-widest text-xs">Infrastructure Telemetry Offline</p>
      </div>
    );
  }

  const currentPlan = subscription.planId?.toUpperCase() || "FREE";

  if (compact) {
    return (
      <div className="space-y-4">
        <UsageItem 
          label="Certificates" 
          current={usage.current.certificates} 
          limit={usage.limits.certificates} 
          percentage={usage.percentageUsed.certificates}
          statusColor={getStatusColor(usage.percentageUsed.certificates)}
          progressColor={getProgressColor(usage.percentageUsed.certificates)}
          icon={FileText}
        />
        <UsageItem 
          label="API Requests" 
          current={usage.current.apiCalls} 
          limit={usage.limits.apiCalls} 
          percentage={usage.percentageUsed.apiCalls}
          statusColor={getStatusColor(usage.percentageUsed.apiCalls)}
          progressColor={getProgressColor(usage.percentageUsed.apiCalls)}
          icon={Zap}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Plan Summary Card */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900 group">
        <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="size-48 rotate-12" />
          </div>
          
          <div className="flex items-center gap-8 relative z-10">
            <div className="size-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary shadow-inner">
              <Zap className="size-10" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase px-3 py-1">
                  Active Subscription
                </Badge>
                {usage.percentageUsed.certificates > 80 && (
                  <Badge variant="destructive" className="font-black text-[10px] uppercase px-3 py-1">
                    Near Limit
                  </Badge>
                )}
              </div>
              <h3 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
                {currentPlan} <span className="text-primary">Infrastucture</span>.
              </h3>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
                Renewal Date: {usage.current.billingPeriod || "N/A"}
              </p>
            </div>
          </div>

          <Button 
            variant="outline"
            className="h-14 px-8 rounded-2xl border-neutral-200 dark:border-neutral-800 font-black text-xs uppercase tracking-widest relative z-10 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
            onClick={() => window.location.href = '/institution/subscription'}
          >
            Upgrade Resources
            <ArrowUpRight className="ml-2 size-4" />
          </Button>
        </div>
      </Card>

      {/* Usage Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UsageCard 
          title="Protocol Issuance" 
          description="Total certificates deployed to blockchain"
          current={usage.current.certificates} 
          limit={usage.limits.certificates} 
          percentage={usage.percentageUsed.certificates}
          statusColor={getStatusColor(usage.percentageUsed.certificates)}
          progressColor={getProgressColor(usage.percentageUsed.certificates)}
          icon={FileText}
          unit="Credentials"
        />
        <UsageCard 
          title="Infrastructure Access" 
          description="High-performance API requests processed"
          current={usage.current.apiCalls} 
          limit={usage.limits.apiCalls} 
          percentage={usage.percentageUsed.apiCalls}
          statusColor={getStatusColor(usage.percentageUsed.apiCalls)}
          progressColor={getProgressColor(usage.percentageUsed.apiCalls)}
          icon={Zap}
          unit="Requests"
        />
      </div>
    </div>
  );
};

function UsageCard({ title, description, current, limit, percentage, statusColor, progressColor, icon: Icon, unit }: any) {
  const isUnlimited = limit === -1;
  const displayLimit = isUnlimited ? "∞" : limit.toLocaleString();

  return (
    <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
      <CardContent className="p-10 space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <Icon className="size-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">{title}</h4>
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest">{description}</p>
            </div>
          </div>
          <div className="text-right">
             <span className={cn("text-3xl font-black tracking-tighter", statusColor)}>
              {percentage}%
             </span>
             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Utilized</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Live Registry</p>
              <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                {current.toLocaleString()} <span className="text-neutral-400 text-sm font-bold">/ {displayLimit} {unit}</span>
              </p>
            </div>
            {!isUnlimited && percentage > 75 && (
              <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full">
                <AlertTriangle className="size-3" />
                Resource Exhaustion
              </div>
            )}
          </div>
          <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-1">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-lg", progressColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageItem({ label, current, limit, percentage, statusColor, progressColor, icon: Icon }: any) {
  const isUnlimited = limit === -1;
  const displayLimit = isUnlimited ? "∞" : limit.toLocaleString();

  return (
    <div className="space-y-2 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-neutral-400" />
          <span className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">{label}</span>
        </div>
        <span className={cn("text-xs font-black", statusColor)}>{percentage}%</span>
      </div>
      <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full", progressColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-neutral-500">
        <span>{current.toLocaleString()} Used</span>
        <span>Limit: {displayLimit}</span>
      </div>
    </div>
  );
}
