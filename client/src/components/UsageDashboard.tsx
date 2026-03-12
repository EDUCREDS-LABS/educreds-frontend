import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';

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

interface Subscription {
  planId: string;
  status: string;
  currentPeriodEnd: string;
}

export const UsageDashboard: React.FC = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const normalizeUsage = (raw: any): UsageData | null => {
    if (!raw) return null;
    if (raw.current && raw.limits && raw.percentageUsed) {
      return raw as UsageData;
    }

    const certificates = Number(raw.certificatesIssued ?? raw.certificatesThisMonth ?? 0);
    const apiCalls = Number(raw.apiCallsMade ?? raw.apiCallsThisMonth ?? 0);
    const storage = Number(raw.storageUsedMb ?? 0);
    const limitsCertificates = Number(raw.certificateLimit ?? raw.limits?.certificates ?? -1);
    const limitsApiCalls = Number(raw.apiCallLimit ?? raw.limits?.apiCalls ?? -1);

    const percentCertificates =
      raw.percentageUsed?.certificates ??
      (limitsCertificates === -1 ? 0 : Math.round((certificates / Math.max(limitsCertificates, 1)) * 100));
    const percentApiCalls =
      raw.percentageUsed?.apiCalls ??
      (limitsApiCalls === -1 ? 0 : Math.round((apiCalls / Math.max(limitsApiCalls, 1)) * 100));

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
        certificates: Number(percentCertificates) || 0,
        apiCalls: Number(percentApiCalls) || 0,
      },
    };
  };

  const fetchUsageData = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const [usageRes, subRes] = await Promise.all([
        fetch(`${API_CONFIG.CERT}/api/subscription/usage`, { headers: authHeaders }),
        fetch(`${API_CONFIG.CERT}/api/subscription/current`, { headers: authHeaders })
      ]);
      
      const usageData = await usageRes.json();
      const subData = await subRes.json();
      
      setUsage(normalizeUsage(usageData?.usage ?? usageData));
      setSubscription(subData.subscription);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return <div className="p-6">Loading usage data...</div>;
  }

  if (!usage || !subscription) {
    return <div className="p-6">Failed to load usage data</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usage & Billing</h2>
        <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
          {subscription.planId.toUpperCase()} - {subscription.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Certificate Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.current.certificates}
              <span className="text-sm font-normal text-muted-foreground">
                /{usage.limits.certificates === -1 ? '∞' : usage.limits.certificates}
              </span>
            </div>
            {usage.limits.certificates !== -1 && (
              <>
                <Progress 
                  value={usage.percentageUsed.certificates} 
                  className="mt-2"
                />
                <p className={`text-xs mt-1 ${getStatusColor(usage.percentageUsed.certificates)}`}>
                  {usage.percentageUsed.certificates}% used
                </p>
              </>
            )}
            {usage.percentageUsed.certificates >= 90 && (
              <div className="flex items-center mt-2 text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-xs">Limit almost reached</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Calls Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.current.apiCalls}
              <span className="text-sm font-normal text-muted-foreground">
                /{usage.limits.apiCalls === -1 ? '∞' : usage.limits.apiCalls}
              </span>
            </div>
            {usage.limits.apiCalls !== -1 && (
              <>
                <Progress 
                  value={usage.percentageUsed.apiCalls} 
                  className="mt-2"
                />
                <p className={`text-xs mt-1 ${getStatusColor(usage.percentageUsed.apiCalls)}`}>
                  {usage.percentageUsed.apiCalls}% used
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Billing Period */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.current.billingPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Resets: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Warnings */}
      {(usage.percentageUsed.certificates >= 75 || usage.percentageUsed.apiCalls >= 75) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="font-medium text-yellow-800">Usage Warning</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You're approaching your monthly limits. Consider upgrading your plan to avoid service interruption.
                </p>
                <Button className="mt-3" size="sm" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limit Exceeded */}
      {(usage.percentageUsed.certificates >= 100 || usage.percentageUsed.apiCalls >= 100) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="font-medium text-red-800">Limit Exceeded</h3>
                <p className="text-sm text-red-700 mt-1">
                  You've reached your monthly limit. Upgrade now to continue using the service.
                </p>
                <Button className="mt-3" size="sm" variant="destructive">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
