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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-white text-2xl ${profile.gradeColor}`}>
            {profile.grade}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* PoIC Score Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Proof of Institutional Credibility</p>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-semibold ${profile.trend === 'up' ? 'text-green-600' : profile.trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
                {profile.trend === 'up' ? '+' : profile.trend === 'down' ? '-' : ''}{profile.trendValue}
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{profile.poicScore}</span>
            <span className="text-muted-foreground text-sm">/100</span>
          </div>
          <Progress value={profile.poicScore} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Issued</p>
            <p className="text-lg font-bold mt-1">{profile.issuanceCount}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-xs text-red-600">Revoked</p>
            <p className="text-lg font-bold text-red-600 mt-1">{profile.revocationRate}%</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-600">Feedback</p>
            <p className="text-lg font-bold text-green-600 mt-1">{profile.employerFeedback}</p>
          </div>
        </div>

        {/* Risk Level */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Risk Assessment</p>
          <Badge className={getRiskColor(profile.riskLevel)}>
            {profile.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {profile.riskLevel === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
            {profile.riskLevel === 'medium' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {profile.riskLevel.charAt(0).toUpperCase() + profile.riskLevel.slice(1)} Risk
          </Badge>
        </div>

        {/* Score Components Breakdown */}
        {expandable && (
          <div className="space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Score Components (Simplified)</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Issuance Accuracy</span>
                <span className="font-semibold">{profile.scoreComponents.issuanceAccuracy}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Revocation Rate</span>
                <span className="font-semibold">{profile.scoreComponents.revocationRate}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Employer Feedback</span>
                <span className="font-semibold">{profile.scoreComponents.employerFeedback}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {onViewDetails && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onViewDetails}
          >
            View Full Profile
          </Button>
        )}
      </CardContent>
    </Card>
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
