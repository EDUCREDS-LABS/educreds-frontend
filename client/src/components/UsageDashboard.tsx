import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Calendar, CreditCard, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/loading-skeleton';

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
      // Use raw fetch for usage if not in api helper yet, but I should check if I can add it to api helper
      // For now, I'll use the existing logic but wrapped in useQuery
      const authHeaders = (await import('@/lib/auth')).getAuthHeaders();
      const { API_CONFIG } = await import('@/config/api');
      const res = await fetch(`${API_CONFIG.CERT}/api/subscription/usage`, { headers: authHeaders });
      const data = await res.json();
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
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-emerald-600';
  };

  if (usageLoading || subLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const usage = usageData;
  const subscription = (subData as any)?.subscription;

  if (!usage || !subscription) {
    return <div className="p-4 text-center text-sm text-neutral-500">Failed to load usage data</div>;
  }

  if (compact) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            <span>Certificates</span>
            <span className={getStatusColor(usage.percentageUsed.certificates)}>
              {usage.current.certificates}/{usage.limits.certificates === -1 ? '∞' : usage.limits.certificates}
            </span>
          </div>
          <Progress value={usage.percentageUsed.certificates} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            <span>API Queries</span>
            <span className={getStatusColor(usage.percentageUsed.apiCalls)}>
              {usage.current.apiCalls}/{usage.limits.apiCalls === -1 ? '∞' : usage.limits.apiCalls}
            </span>
          </div>
          <Progress value={usage.percentageUsed.apiCalls} className="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">Usage & Billing</h2>
        <Badge className={subscription.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-red-50 text-red-700 border-red-200 font-bold'}>
          {subscription.planId.toUpperCase()} • {subscription.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UsageCard 
          title="Certificates"
          current={usage.current.certificates}
          limit={usage.limits.certificates}
          percentage={usage.percentageUsed.certificates}
          icon={Award}
          color="blue"
        />
        <UsageCard 
          title="API Calls"
          current={usage.current.apiCalls}
          limit={usage.limits.apiCalls}
          percentage={usage.percentageUsed.apiCalls}
          icon={Activity}
          color="purple"
        />
        <UsageCard 
          title="Billing Period"
          current={usage.current.billingPeriod}
          icon={Calendar}
          color="amber"
          subtitle={`Resets: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
        />
      </div>

      {(usage.percentageUsed.certificates >= 75 || usage.percentageUsed.apiCalls >= 75) && (
        <Alert className="border-amber-200 bg-amber-50 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="ml-3">
            <h3 className="font-bold text-amber-800">Usage Warning</h3>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              You're approaching your monthly limits. Consider upgrading your plan to avoid service interruption.
            </p>
            <Button className="mt-4 font-bold shadow-sm" size="sm" variant="outline">
              Upgrade Plan
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
};

function UsageCard({ title, current, limit, percentage, icon: Icon, color, subtitle }: any) {
  const statusColor = (p: number) => {
    if (p >= 90) return 'text-red-600';
    if (p >= 75) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <Card className="border-0 shadow-sm bg-white rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black text-neutral-400 uppercase tracking-widest">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-neutral-50">
          <Icon className="h-4 w-4 text-neutral-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-neutral-900 tracking-tighter">
          {current}
          {limit !== undefined && (
            <span className="text-sm font-bold text-neutral-400 ml-1">
              /{limit === -1 ? '∞' : limit}
            </span>
          )}
        </div>
        {percentage !== undefined && (
          <div className="mt-4 space-y-2">
            <Progress value={percentage} className="h-1.5" />
            <p className={`text-[10px] font-black uppercase tracking-wider ${statusColor(percentage)}`}>
              {percentage}% used
            </p>
          </div>
        )}
        {subtitle && <p className="text-xs font-bold text-neutral-400 mt-2 uppercase">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
