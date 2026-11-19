/**
 * Employer Verification page — Phase 2 (Tiered Engine Architecture)
 * Wraps VerificationCenter with employer context.
 * Employers are authenticated verifiers — plan is read from auth.
 */
import { useAuth } from "@/hooks/useAuth";
import { VerificationCenter } from "@/components/verification/VerificationCenter";

export default function Verify() {
  const { user, isAuthenticated } = useAuth();
  const plan = (user as any)?.subscriptionPlan ?? "Free";

  return (
    <div className="py-12 px-4">
      <VerificationCenter mode="both" plan={plan} isAuthenticated={isAuthenticated} />
    </div>
  );
}
