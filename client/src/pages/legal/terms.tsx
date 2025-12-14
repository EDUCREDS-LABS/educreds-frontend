import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="url(#logo-gradient)" />
                <path d="M10 22L16 10L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                EduCreds
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Terms of Service</h1>
          <p className="text-neutral-600 mb-8">Last updated: January 2025</p>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-neutral-700 mb-4">
                By accessing and using EduCreds ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. Description of Service</h2>
              <p className="text-neutral-700 mb-4">
                EduCreds is a blockchain-based platform that enables educational institutions to issue, manage, and verify academic certificates 
                as Non-Fungible Tokens (NFTs). The platform provides:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Certificate issuance and management tools for verified educational institutions</li>
                <li>Instant certificate verification services for employers and third parties</li>
                <li>Secure blockchain-based storage of academic credentials</li>
                <li>Template marketplace for certificate designs</li>
                <li>Student portal for certificate management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. User Accounts and Registration</h2>
              <h3 className="text-xl font-medium text-neutral-800 mb-2">3.1 Institution Registration</h3>
              <p className="text-neutral-700 mb-4">
                Educational institutions must provide valid documentation including registration licenses, trading licenses, 
                and government approvals. All applications are subject to verification and approval by EduCreds.
              </p>
              <h3 className="text-xl font-medium text-neutral-800 mb-2">3.2 Account Security</h3>
              <p className="text-neutral-700 mb-4">
                Users are responsible for maintaining the confidentiality of their account credentials and for all activities 
                that occur under their account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Blockchain and Cryptocurrency</h2>
              <p className="text-neutral-700 mb-4">
                EduCreds operates on blockchain technology. Users acknowledge and understand:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Blockchain transactions are irreversible</li>
                <li>Gas fees may apply for blockchain transactions</li>
                <li>Users must have compatible cryptocurrency wallets</li>
                <li>EduCreds is not responsible for blockchain network issues or delays</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Prohibited Uses</h2>
              <p className="text-neutral-700 mb-4">Users may not use EduCreds to:</p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Issue fraudulent or false certificates</li>
                <li>Impersonate educational institutions</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with the platform's security features</li>
                <li>Upload malicious content or malware</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Intellectual Property</h2>
              <p className="text-neutral-700 mb-4">
                EduCreds and its original content, features, and functionality are owned by EduCreds and are protected by 
                international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-neutral-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-neutral-700 mb-4">
                EduCreds shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">9. Termination</h2>
              <p className="text-neutral-700 mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                under our sole discretion, for any reason whatsoever and without limitation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">10. Changes to Terms</h2>
              <p className="text-neutral-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">11. Contact Information</h2>
              <p className="text-neutral-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-neutral-700">
                  <strong>Email:</strong> legal@educreds.com<br />
                  <strong>Address:</strong> EduCreds Legal Department<br />
                  <strong>Website:</strong> https://educreds.com
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}