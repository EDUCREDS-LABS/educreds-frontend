// @ts-nocheck
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Shield,
  Users,
  Activity,
} from 'lucide-react';

interface CredibilityProfile {
  name: string;
  poicScore: number;
  grade: string;
  gradeColor: string;
  riskLevel: 'low' | 'medium' | 'high';
  issuanceCount: number;
  revocationRate: number;
  employerFeedback: number;
  scoreComponents: {
    issuanceAccuracy: number;
    revocationRate: number;
    employerFeedback: number;
    governanceBehavior: number;
    auditOutcomes: number;
    aiRiskScore: number;
  };
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  lastUpdated: string;
}

export function InstitutionCredibilityCard({
  profile,
  expandable = true,
  onViewDetails,
}: {
  profile: CredibilityProfile;
  expandable?: boolean;
  onViewDetails?: () => void;
}) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-900';
      case 'medium':
        return 'bg-yellow-100 text-yellow-900';
      case 'high':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-slate-100 text-slate-900';
    }
  };

  const getTrendIcon = () => {
    if (profile.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (profile.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-slate-400" />;
  };

  return (
    <Card className="shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden border-none bg-white dark:bg-neutral-900 transition-all hover:shadow-3xl">
      <CardHeader className="space-y-4 p-10 border-b border-neutral-50 dark:border-neutral-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-black tracking-tight">{profile.name}</CardTitle>
              {profile.poicScore > 60 && (
                <div className="size-6 flex-shrink-0">
                  <img 
                    src="https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1777384457/verified_badge_mysrk6.jpg" 
                    alt="Verified" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              )}
            </div>
            <CardDescription className="text-[10px] mt-2 font-black uppercase tracking-widest text-neutral-400">
              Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className={`size-16 rounded-3xl flex items-center justify-center font-black text-white text-2xl shadow-lg ${profile.gradeColor}`}>
            {profile.grade}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-10 space-y-8">
        {/* PoIC Score Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Proof of Credibility</p>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-sm font-black ${profile.trend === 'up' ? 'text-emerald-500' : profile.trend === 'down' ? 'text-red-500' : 'text-neutral-400'}`}>
                {profile.trend === 'up' ? '+' : profile.trend === 'down' ? '-' : ''}{profile.trendValue}
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-tighter">{profile.poicScore}</span>
            <span className="text-neutral-400 font-bold mb-2">/100</span>
          </div>
          <Progress value={profile.poicScore} className="h-3 bg-neutral-100 dark:bg-neutral-800" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <MetricBox label="Issued" value={profile.issuanceCount} color="bg-neutral-50 dark:bg-neutral-800" />
          <MetricBox label="Revoked" value={`${profile.revocationRate}%`} color="bg-red-50 text-red-600" />
          <MetricBox label="Feedback" value={profile.employerFeedback} color="bg-emerald-50 text-emerald-600" />
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100">Risk Matrix</p>
          <Badge className={cn("border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm", getRiskColor(profile.riskLevel))}>
            {profile.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        {/* Action Button */}
        {onViewDetails && (
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
            onClick={onViewDetails}
          >
            View Full Audit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className={cn("rounded-2xl p-5 text-center transition-all", color)}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    );
}

// Example usage component showing multiple institutions
export function InstitutionCredibilityGrid({
  institutions,
  onViewDetails,
}: {
  institutions: CredibilityProfile[];
  onViewDetails?: (name: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {institutions.map((profile) => (
        <InstitutionCredibilityCard
          key={profile.name}
          profile={profile}
          onViewDetails={() => onViewDetails?.(profile.name)}
        />
      ))}
    </div>
  );
}

// Quick Stats Card for Dashboard Summary
export function InstitutionCredibilityStats({
  institutions,
}: {
  institutions: CredibilityProfile[];
}) {
  const stats = {
    averageScore: Math.round(
      institutions.reduce((sum, inst) => sum + inst.poicScore, 0) / institutions.length,
    ),
    topTier: institutions.filter((i) => i.poicScore >= 85).length,
    highRisk: institutions.filter((i) => i.riskLevel === 'high').length,
    totalIssued: institutions.reduce((sum, inst) => sum + inst.issuanceCount, 0),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Institutional Credibility Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Average PoIC Score</p>
            <p className="text-2xl font-bold mt-1">{stats.averageScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top Tier (A+)</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{stats.topTier}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">High Risk</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{stats.highRisk}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Credentials</p>
            <p className="text-2xl font-bold mt-1">{stats.totalIssued.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
