import { EnterpriseCertificateIssuance } from '@/components/institution/EnterpriseCertificateIssuance';
import { PendingCredentialsPanel } from '@/components/institution/PendingCredentialsPanel';

/** Structured single-credential issuance and CSV bulk issuance. */
export default function InstitutionIssuePage() {
  return (
    <div className="space-y-8">
      <EnterpriseCertificateIssuance />
      <PendingCredentialsPanel />
    </div>
  );
}
