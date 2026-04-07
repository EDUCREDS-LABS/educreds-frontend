import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Landmark,
  Cpu,
  Lock,
  Globe,
  Database,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { governanceApiService } from "@/lib/governanceApiService";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Verification() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: ["institution-verification-status", user?.id],
    queryFn: () => api.getVerificationStatus(),
    enabled: !!user,
  });

  const { data: governanceInstitution, isLoading: governanceLoading } = useQuery({
    queryKey: ["/governance/institutions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        return await governanceApiService.getInstitutionDetail(user!.id);
      } catch (err: any) {
        toast({
          title: "Governance verification check failed",
          description: err.message || "Unable to load governance verification status.",
          variant: "destructive",
        });
        return null;
      }
    },
  });

  const getVerificationStep = (step: string, description: string, isCompleted: boolean, isPending: boolean, icon: any, index: number) => {
    const Icon = icon;
    return (
      <div className="relative group">
        {/* Connection Line */}
        {index < 3 && (
          <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-neutral-100 -translate-x-6 z-0">
            <div className={cn(
              "h-full bg-primary transition-all duration-1000",
              isCompleted ? "w-full" : "w-0"
            )} />
          </div>
        )}
        
        <div className={cn(
          "relative z-10 flex flex-col p-8 rounded-3xl border-2 transition-all duration-500 h-full",
          isCompleted 
            ? "bg-white border-green-500/20 shadow-xl shadow-green-500/5 ring-1 ring-green-500/5" 
            : isPending 
              ? "bg-white border-yellow-500/20 shadow-xl shadow-yellow-500/5 ring-1 ring-yellow-500/5" 
              : "bg-neutral-50/50 border-neutral-100 grayscale-[0.5] opacity-80"
        )}>
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
              "size-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500",
              isCompleted 
                ? "bg-green-500 text-white shadow-green-500/20" 
                : isPending 
                  ? "bg-yellow-500 text-white shadow-yellow-500/20" 
                  : "bg-white text-neutral-400 shadow-neutral-200/50 border border-neutral-100"
            )}>
              <Icon className="size-7" />
            </div>
            {isCompleted ? (
              <Badge className="bg-green-100 text-green-700 border-green-200/50 shadow-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified</Badge>
            ) : isPending ? (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200/50 shadow-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">In Review</Badge>
            ) : (
              <Badge variant="outline" className="text-neutral-400 border-neutral-200 shadow-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Locked</Badge>
            )}
          </div>
          <h3 className={cn(
            "text-lg font-bold mb-2 tracking-tight transition-colors",
            isCompleted || isPending ? "text-neutral-900" : "text-neutral-400"
          )}>{step}</h3>
          <p className="text-sm text-neutral-500 leading-relaxed font-medium">{description}</p>
          
          {isCompleted && (
            <div className="absolute -bottom-2 -right-2">
              <div className="bg-green-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                <CheckCircle className="size-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const verificationStatusFromGovernance = useMemo(() => {
    if (!governanceInstitution) return null;
    return {
      isVerified: (governanceInstitution as any).poicScore && (governanceInstitution as any).poicScore > 0,
      poicScore: (governanceInstitution as any).poicScore,
      certificatesIssued: (governanceInstitution as any).credibilityMetrics?.certificatesIssued ?? 0,
    };
  }, [governanceInstitution]);

  if (isLoading || governanceLoading) {
    return (
      <div className="space-y-12 animate-pulse max-w-7xl mx-auto py-8">
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const isOnboardingVerified = Boolean((verificationStatus as any)?.isVerified);
  const onboardingStatus = (verificationStatus as any)?.verificationStatus || 'not_submitted';
  const isOnboardingApproved = onboardingStatus === "approved";

  const isGovernanceVerified = Boolean(
    isOnboardingVerified ||
      isOnboardingApproved ||
      (verificationStatusFromGovernance?.isVerified &&
        (verificationStatusFromGovernance.poicScore ?? 0) >= 60)
  );

  const governanceStatusLabel = isGovernanceVerified
    ? "Governance Verified"
    : verificationStatusFromGovernance
    ? "Under Governance Review"
    : "Verification Required";

  return (
    <div className="space-y-16 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section with Glassmorphism */}
      <div className="relative overflow-hidden rounded-[40px] bg-neutral-950 p-10 md:p-16 text-white shadow-2xl shadow-neutral-950/20">
        <div className="relative z-10 max-w-3xl space-y-8">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
              Protocol Version 2.4.0
            </Badge>
            <Badge className="bg-white/5 text-white/60 border-white/10 px-4 py-1.5 rounded-full font-bold text-[10px]">
              <Lock className="size-3 mr-1.5" /> Secure Infrastructure
            </Badge>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
              Institutional <span className="text-primary">Trust</span> & Verification.
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-2xl font-medium">
              Establishing a immutable digital identity for global academic authority. EduCreds anchors your institution on the public ledger through a rigorous multi-stage verification pipeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Badge className={cn(
              "px-6 py-3 text-xs font-bold rounded-full border-none shadow-xl",
              isGovernanceVerified ? "bg-green-500 text-white" : "bg-primary text-white"
            )}>
              {isGovernanceVerified && <CheckCircle className="size-3 mr-2" />}
              {governanceStatusLabel}
            </Badge>
            <Link href="/institution/governance-verification">
              <Button className="rounded-full bg-white text-neutral-900 hover:bg-neutral-100 border-none px-8 h-12 font-bold shadow-lg shadow-white/5 transition-all hover:scale-[1.02]">
                <Shield className="size-4 mr-2" />
                Manage Governance Approval
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="absolute -top-24 -right-24 size-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-0 right-0 size-[400px] bg-blue-600/10 rounded-full blur-[100px] opacity-30" />
          
          {/* Abstract Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
      </div>

      {/* Verification Pipeline */}
      <div className="space-y-8 px-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Trust Pipeline</h2>
            <p className="text-neutral-500 font-medium">Your institution's progression through our security protocols.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] bg-neutral-100/50 px-4 py-2 rounded-full border border-neutral-200/50">
            <Database className="size-3" />
            Decentralized Authority System
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {getVerificationStep(
            "Onboarding",
            "Initial document submission and administrative review of credentials.",
            onboardingStatus === "approved",
            onboardingStatus === "pending",
            FileCheck,
            0
          )}
          {getVerificationStep(
            "Accreditation",
            "Verification of academic authority and legitimate operational status.",
            Boolean(verificationStatus as any)?.isVerified,
            onboardingStatus === "pending",
            Landmark,
            1
          )}
          {getVerificationStep(
            "Governance",
            "Decentralized approval via PoIC score and community consensus.",
            isGovernanceVerified,
            !isGovernanceVerified && !!verificationStatusFromGovernance,
            ShieldCheck,
            2
          )}
          {getVerificationStep(
            "Blockchain",
            "Identity anchoring on-chain with unique IIN NFT issuance.",
            Boolean((verificationStatus as any)?.blockchainRegistered),
            Boolean(isOnboardingVerified && !(verificationStatus as any)?.blockchainRegistered),
            Cpu,
            3
          )}
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {!isGovernanceVerified ? (
            <Alert className="bg-amber-50 border-amber-200/50 rounded-[32px] p-10 shadow-xl shadow-amber-500/5">
              <div className="flex gap-6 items-start">
                <div className="size-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner flex-shrink-0">
                  <AlertCircle className="size-8" />
                </div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-amber-900 tracking-tight">Full Verification Required</h4>
                  <AlertDescription className="text-amber-800/80 text-lg leading-relaxed font-medium">
                    Your institution is operating on a limited protocol. To unlock high-volume issuance, community governance participation, and the "Verified Institutional Partner" badge, complete the decentralized governance assessment.
                  </AlertDescription>
                  <Link href="/institution/governance-verification">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02]">
                      Initiate Final Review <ArrowRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Alert>
          ) : (
            <Card className="border-none shadow-2xl shadow-neutral-200/40 rounded-[40px] overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-green-500/10 group-hover:text-green-500/20 transition-colors">
                <ShieldCheck className="size-48 -rotate-12 translate-x-12 -translate-y-12" />
              </div>
              <CardHeader className="bg-neutral-50/50 p-10 border-b border-neutral-100 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-500/20">
                    <ShieldCheck className="size-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tight">Verified Governance Member</CardTitle>
                    <CardDescription className="font-bold text-green-600/80 uppercase tracking-widest text-[10px]">Strategic Identity Active</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-8 relative z-10">
                <p className="text-neutral-500 text-lg leading-relaxed font-medium">
                  Your institution is a verified node in the EduCreds DAO. You have achieved full cryptographic trust, enabling advanced issuance capabilities and decentralized governance rights.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/institution/governance-workspace">
                    <Button className="w-full h-14 rounded-2xl group bg-neutral-900 hover:bg-neutral-800 text-white font-bold" variant="default">
                      Governance Workspace
                      <ArrowRight className="size-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/institution/governance-verification">
                    <Button className="w-full h-14 rounded-2xl font-bold border-neutral-200 hover:bg-neutral-50" variant="outline">
                      Review Trust Documents
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-neutral-200/30 bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                <Globe className="size-3" /> Digital Footprint
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">Identity Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="space-y-4">
                <div className="group">
                  <p className="text-[10px] font-black text-neutral-400 uppercase mb-2 tracking-widest">Institution ID</p>
                  <div className="p-3 bg-neutral-50 rounded-xl font-mono text-[11px] text-neutral-600 break-all border border-neutral-100 group-hover:border-primary/20 transition-colors">
                    {user?.id}
                  </div>
                </div>
                <div className="group">
                  <p className="text-[10px] font-black text-neutral-400 uppercase mb-2 tracking-widest">Network Node</p>
                  <div className="p-3 bg-neutral-50 rounded-xl font-mono text-[11px] text-neutral-600 break-all border border-neutral-100 group-hover:border-primary/20 transition-colors">
                    {user?.walletAddress || "UNLINKED"}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Network Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200/50 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Live</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-bold">
                  <div className="size-2 bg-green-500 rounded-full" />
                  Connected to Base Protocol
                </div>
                <Button variant="link" className="p-0 h-auto text-[11px] font-black text-primary uppercase mt-4 hover:no-underline">
                  View Node Explorer <ExternalLink className="size-3 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
