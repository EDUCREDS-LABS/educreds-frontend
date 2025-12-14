import { FC } from "react";

const ApiReferencePage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      <h1 className="text-4xl font-bold mb-4">API Reference</h1>

      <h2 className="text-2xl font-bold mt-8 mb-4">Base URL</h2>
      <pre className="bg-gray-800 text-white p-4 rounded">
        https://api.educreds.xyz/v1/
      </pre>

      <h2 className="text-2xl font-bold mt-8 mb-4">Authentication</h2>
      <p>Explain API keys or JWT.</p>

      <h2 className="text-2xl font-bold mt-8 mb-4">Endpoints</h2>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">Issue Certificate</h3>
        <p className="mb-2">
          <span className="font-bold text-green-500">POST</span>{" "}
          /certificates/issue
        </p>
        <p className="font-bold">Body:</p>
        <ul className="list-disc list-inside">
          <li>institutionId</li>
          <li>studentWallet</li>
          <li>metadataURI</li>
        </ul>
        <p className="font-bold mt-2">Returns:</p>
        <ul className="list-disc list-inside">
          <li>transactionHash</li>
          <li>certificateId</li>
        </ul>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">Verify Certificate</h3>
        <p className="mb-2">
          <span className="font-bold text-blue-500">GET</span>{" "}
          /certificates/verify/&#123;certificateId&#125;
        </p>
        <p className="font-bold mt-2">Returns:</p>
        <ul className="list-disc list-inside">
          <li>validity (true/false)</li>
          <li>issuer</li>
          <li>timestamp</li>
        </ul>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">List Certificates (Marketplace)</h3>
        <p className="mb-2">
          <span className="font-bold text-blue-500">GET</span>{" "}
          /marketplace/list
        </p>
        <p className="font-bold mt-2">Returns:</p>
        <ul className="list-disc list-inside">
          <li>certificate metadata</li>
          <li>pricing</li>
          <li>AI recommendations</li>
        </ul>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">Institution Login/Auth</h3>
        <p className="mb-2">
          <span className="font-bold text-green-500">POST</span>{" "}
          /auth/institution
        </p>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Errors & Codes</h2>
      <ul className="list-disc list-inside">
        <li>400 – Invalid metadata</li>
        <li>401 – Unauthorized</li>
        <li>404 – Certificate not found</li>
        <li>500 – Blockchain service unavailable</li>
      </ul>
    </div>
  );
};

export default ApiReferencePage;
