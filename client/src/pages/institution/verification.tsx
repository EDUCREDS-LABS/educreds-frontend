import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, Shield, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { governanceApiService } from "@/lib/governanceApiService";
import { Link } from "wouter";

export default function Verification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showGovernanceSections, setShowGovernanceSections] = useState(false);

  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: ["/api/institutions/verification-status"],
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

  const getVerificationStep = (step: string, isCompleted: boolean, isPending: boolean) => {
    if (isCompleted) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-medium text-neutral-900">{step}</h3>
          <p className="text-sm text-green-600">Completed</p>
        </div>
      );
    } else if (isPending) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="font-medium text-neutral-900">{step}</h3>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="font-medium text-neutral-900">{step}</h3>
          <p className="text-sm text-neutral-500">Not Started</p>
        </div>
      );
    }
  };

  const verificationStatusFromGovernance = useMemo(() => {
    if (!governanceInstitution) return null;
    return {
      isVerified: (governanceInstitution as any).poicScore && (governanceInstitution as any).poicScore > 0,
      poicScore: (governanceInstitution as any).poicScore,
      certificatesIssued: (governanceInstitution as any).credibilityMetrics?.certificatesIssued ?? 0,
    };
  }, [governanceInstitution]);

  // Institution can access governance/analytics if governance verification is effectively complete
  const isGovernanceVerified = Boolean(
    verificationStatusFromGovernance?.isVerified &&
      (verificationStatusFromGovernance.poicScore ?? 0) >= 60
  );

  if (isLoading || governanceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnboardingVerified = (verificationStatus as any)?.isVerified;
  const onboardingStatus = (verificationStatus as any)?.verificationStatus || 'not_submitted';

  const governanceStatusLabel = isGovernanceVerified
    ? "Governance Verified"
    : verificationStatusFromGovernance
    ? "Under Governance Review"
    : "Not Verified";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900" data-testid="page-title">
            Institution Verification
          </h1>
          <p className="text-neutral-600">
            Governance-aware verification of your institution. Once approved, you can participate in EduCreds governance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={isGovernanceVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
            {governanceStatusLabel}
          </Badge>
          <Button asChild variant="outline">
            <Link href="/institution/governance-verification">
              <Shield className="w-4 h-4 mr-2" />
              Open Governance Verification Form
            </Link>
          </Button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {!isGovernanceVerified && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your institution must pass governance verification before you can fully participate in voting and advanced
            analytics. Complete the governance verification form to proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Verification & Governance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {getVerificationStep("Onboarding Documents", onboardingStatus === "approved", onboardingStatus === "pending")}
            {getVerificationStep("Identity & Accreditation", Boolean(verificationStatus as any)?.isVerified, onboardingStatus === "pending")}
            {getVerificationStep("Governance Verification", isGovernanceVerified, !isGovernanceVerified)}
            {getVerificationStep(
              "Blockchain Registration",
              Boolean((verificationStatus as any)?.blockchainRegistered),
              Boolean(isOnboardingVerified && !(verificationStatus as any)?.blockchainRegistered)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Status Alert */}
      {isOnboardingVerified && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {(verificationStatus as any)?.blockchainRegistered 
              ? "Your institution is registered on the blockchain and can issue certificates."
              : "Your institution is verified but blockchain registration is pending. This will be completed automatically by our admin team."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Governance actions available only when verified */}
      {isGovernanceVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Governance & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-600">
              Your institution is governance-verified. Access the Governance Workspace to participate in EduCreds DAO,
              vote on proposals, view analytics, and manage your PoIC score.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/institution/governance-workspace">
                <Button className="w-full justify-between" variant="default">
                  <Shield className="w-4 h-4 mr-2" />
                  Open Governance Workspace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/institution/governance-verification">
                <Button className="w-full justify-between" variant="outline">
                  View Verification Proposal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
