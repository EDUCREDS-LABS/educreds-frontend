import { FC } from "react";

const DocumentationPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>

      <h2 className="text-3xl font-bold mb-4">Introduction</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">What EduCreds is</li>
        <li className="mb-2">How it works</li>
        <li className="mb-2">Key Features</li>
        <li className="mb-2">Architecture overview</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">How institutions onboard</li>
        <li className="mb-2">How students access certificates</li>
        <li className="mb-2">How employers verify credentials</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Certificate Issuing Guide</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Step-by-step on issuing a certificate</li>
        <li className="mb-2">Metadata structure</li>
        <li className="mb-2">NFT minting flow</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Verification Guide</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">How verification works</li>
        <li className="mb-2">Error codes</li>
        <li className="mb-2">API endpoints (basic)</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Marketplace Guide</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Listing certificates</li>
        <li className="mb-2">AI-powered recommendations</li>
        <li className="mb-2">Pricing models</li>
      </ul>

      <h2 className="text-3xl font-bold mb-4">Security & Compliance</h2>
      <ul className="list-disc list-inside">
        <li className="mb-2">Blockchain transparency</li>
        <li className="mb-2">GDPR considerations</li>
        <li className="mb-2">Data handling practices</li>
      </ul>
    </div>
  );
};

export default DocumentationPage;
