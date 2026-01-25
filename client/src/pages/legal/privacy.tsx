import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPolicy() {
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
                <path d="M10 22L16 10L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Privacy Policy</h1>
              <p className="text-neutral-600">Last updated: January 2025</p>
            </div>
          </div>

          {/* Privacy Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Lock className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-blue-900 mb-1">Data Encryption</h3>
              <p className="text-sm text-blue-700">All sensitive data is encrypted using industry-standard protocols</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <Eye className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">Transparency</h3>
              <p className="text-sm text-green-700">Clear information about what data we collect and how we use it</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <Database className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-purple-900 mb-1">Minimal Collection</h3>
              <p className="text-sm text-purple-700">We only collect data necessary for platform functionality</p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Information We Collect</h2>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">1.1 Personal Information</h3>
              <p className="text-neutral-700 mb-4">
                When you register for EduCreds, we collect:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Institution details (for educational institutions)</li>
                <li>Professional credentials and documentation</li>
                <li>Blockchain wallet addresses</li>
              </ul>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">1.2 Certificate Data</h3>
              <p className="text-neutral-700 mb-4">
                For certificate issuance and verification:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Student academic information</li>
                <li>Certificate metadata and content</li>
                <li>Issuance and verification timestamps</li>
                <li>Blockchain transaction records</li>
              </ul>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">1.3 Technical Information</h3>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and analytics data</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-neutral-700 mb-4">We use collected information to:</p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Provide and maintain our certificate issuance and verification services</li>
                <li>Verify the identity and credentials of educational institutions</li>
                <li>Process blockchain transactions for certificate minting</li>
                <li>Communicate with users about their accounts and services</li>
                <li>Improve platform security and prevent fraud</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Comply with legal obligations and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. Blockchain and Public Data</h2>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                <p className="text-amber-800 font-medium mb-2">Important Notice:</p>
                <p className="text-amber-700 text-sm">
                  Certificate data stored on the blockchain is publicly accessible and immutable.
                  This includes certificate metadata, issuance details, and verification records.
                </p>
              </div>
              <p className="text-neutral-700 mb-4">
                By using EduCreds, you understand that:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Blockchain transactions are permanent and cannot be deleted</li>
                <li>Certificate information may be visible to anyone with blockchain access</li>
                <li>We implement privacy-preserving techniques where possible</li>
                <li>Sensitive personal data is not stored directly on the blockchain</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Information Sharing</h2>
              <p className="text-neutral-700 mb-4">We do not sell your personal information. We may share information in these situations:</p>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">4.1 With Your Consent</h3>
              <p className="text-neutral-700 mb-4">
                When you explicitly authorize us to share information with third parties.
              </p>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">4.2 Service Providers</h3>
              <p className="text-neutral-700 mb-4">
                With trusted partners who help us operate the platform (hosting, analytics, payment processing).
              </p>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">4.3 Legal Requirements</h3>
              <p className="text-neutral-700 mb-4">
                When required by law, court order, or to protect our rights and safety.
              </p>

              <h3 className="text-xl font-medium text-neutral-800 mb-2">4.4 Certificate Verification</h3>
              <p className="text-neutral-700 mb-4">
                Certificate information is shared with authorized verifiers (employers, institutions) as part of our verification service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Data Security</h2>
              <p className="text-neutral-700 mb-4">We implement comprehensive security measures:</p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>End-to-end encryption for sensitive data transmission</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication for administrative access</li>
                <li>Blockchain security through smart contract audits</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-neutral-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 ml-4">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Delete your account and associated data (subject to legal requirements)</li>
                <li>Opt out of non-essential communications</li>
                <li>Request data portability</li>
                <li>File complaints with relevant data protection authorities</li>
              </ul>
              <p className="text-neutral-700 mb-4">
                Note: Blockchain data cannot be modified or deleted due to the immutable nature of blockchain technology.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. International Data Transfers</h2>
              <p className="text-neutral-700 mb-4">
                EduCreds operates globally. Your information may be transferred to and processed in countries other than your own.
                We ensure appropriate safeguards are in place for international transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Children's Privacy</h2>
              <p className="text-neutral-700 mb-4">
                EduCreds is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                If we become aware of such collection, we will take steps to delete the information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-neutral-700 mb-4">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notifications.
                Continued use of EduCreds after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">10. Contact Us</h2>
              <p className="text-neutral-700 mb-4">
                For privacy-related questions or to exercise your rights, contact us:
              </p>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-neutral-700">
                  <strong>Privacy Officer:</strong> privacy@educreds.com<br />
                  <strong>Data Protection:</strong> dpo@educreds.com<br />
                  <strong>General Inquiries:</strong> support@educreds.com<br />
                  <strong>Address:</strong> EduCreds Privacy Department<br />
                  <strong>Response Time:</strong> We aim to respond within 30 days
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}