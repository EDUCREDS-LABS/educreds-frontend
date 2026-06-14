import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';

export default function TermsOfService() {
  return (
    <InfoPageLayout 
      title="Terms of Service" 
      subtitle="The legal framework governing the use of the EduCreds protocol and infrastructure."
      badge="Legal Framework"
    >
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12">
        <section>
          <p className="text-neutral-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Effective: January 2025</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">1. Acceptance of Protocol Terms</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            By accessing and using EduCreds ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">2. Description of Infrastructure</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            EduCreds is a blockchain-based platform that enables educational institutions to issue, manage, and verify academic certificates 
            as Non-Fungible Tokens (NFTs). The platform provides:
          </p>
          <ul className="list-disc list-inside text-neutral-600 font-medium mt-4 space-y-2">
            <li>Certificate issuance and management tools for verified educational institutions</li>
            <li>Instant certificate verification services for employers and third parties</li>
            <li>Secure blockchain-based storage of academic credentials</li>
            <li>Template marketplace for certificate designs</li>
            <li>Student portal for certificate management</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">3. Institutional Nodes & Governance</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            Educational institutions must provide valid documentation including registration licenses, trading licenses, 
            and government approvals. All applications are subject to ETA (EduCreds Trust Agent) analysis and DAO approval.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">4. Immutable Finality</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            EduCreds operates on blockchain technology. Users acknowledge that transactions on the public ledger are irreversible, subject to gas fees, and dependent on network availability.
          </p>
        </section>

        <section className="bg-neutral-50 p-10 rounded-[32px] border border-neutral-100">
          <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 mb-4">Legal Contact</h3>
          <p className="text-neutral-500 font-medium text-sm">
            Questions regarding the protocol terms should be directed to:<br/>
            <span className="text-blue-600 font-bold">legal@educreds.xyz</span>
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}
