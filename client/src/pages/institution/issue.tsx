import { EnterpriseCertificateIssuance } from '@/components/institution/EnterpriseCertificateIssuance';
import { PendingCredentialsPanel } from '@/components/institution/PendingCredentialsPanel';

/**
 * Institution Certificate Issuance Page
 *
 * Enterprise-grade certificate issuance interface with:
 * - Multiple issuance methods (Template, PDF, Bulk CSV)
 * - Wizard-style workflow
 * - Real-time validation and preview
 * - AI-powered template recommendations
 * - Comprehensive error handling and analytics
 * - Resolution of credentials pending on-chain confirmation
 */
export default function InstitutionIssuePage() {
  return (
    <div className="space-y-8">
      <EnterpriseCertificateIssuance />
      <PendingCredentialsPanel />
    </div>
  );
}
