import React from 'react';
import { InfoPageLayout } from '@/components/InfoPageLayout';

export default function PrivacyPolicy() {
  return (
    <InfoPageLayout 
      title="Privacy Policy" 
      subtitle="How we manage institutional data and protect learner privacy within the EduCreds ecosystem."
      badge="Security & Data"
    >
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12">
        <section>
          <p className="text-neutral-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Last Updated: January 2025</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">1. Data Sovereignty</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            EduCreds follows a "Privacy-First" architecture. Personal Student Data (PII) is wrapped in Decentralized Identifiers (DIDs) and stored off-chain or in encrypted IPFS documents, keeping only immutable hashes on the public ledger.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">2. Information Collection</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            We collect institutional verification documents, administrative contact details, and technical node metadata required for protocol participation and DAO governance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">3. Rights of the Individual</h2>
          <p className="text-neutral-600 font-medium leading-relaxed mt-4">
            Learners have the absolute right to control their academic credentials. Our implementation of Soulbound Tokens ensures that while a record is permanent, the visibility and association with a specific digital identity remain under user control where technically feasible.
          </p>
        </section>

        <section className="bg-neutral-50 p-10 rounded-[32px] border border-neutral-100">
          <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 mb-4">Security Inquiries</h3>
          <p className="text-neutral-500 font-medium text-sm">
            For GDPR, RTBF, or data compliance requests, please contact:<br/>
            <span className="text-blue-600 font-bold">privacy@educreds.xyz</span>
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}
