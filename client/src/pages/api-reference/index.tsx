import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Code, Key, Zap, ShieldCheck } from "lucide-react";

const ApiReferencePage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">EduCreds API Reference</h1>
          <p className="text-xl mb-8">
            Build on a decentralized credential infrastructure with PoIC for trust and clean, off-chain quotas for access.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.open("/developer-portal/index.html", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Developer Portal
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => window.open("#getting-api-keys", "_self")}
            >
              <Key className="h-4 w-4 mr-2" />
              Get API Key
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-10">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Code className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Standard API</h3>
              <p className="text-sm text-gray-600">RESTful endpoints for certificate issuance</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">W3C VC Support</h3>
              <p className="text-sm text-gray-600">Standards-compliant verifiable credentials</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Key className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">API Keys & JWT</h3>
              <p className="text-sm text-gray-600">Secure auth for integrators and institutions</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <ShieldCheck className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">PoIC Governance</h3>
              <p className="text-sm text-gray-600">On-chain trust, off-chain quotas</p>
            </CardContent>
          </Card>
        </div>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle>Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-4 rounded font-mono text-sm overflow-x-auto">
              https://api.educreds.xyz/api/v1/standard
            </div>
            <p className="text-sm text-gray-600 mt-2">
              All API requests should be made to this base URL. For testing, use our sandbox environment:
            </p>
            <div className="bg-gray-100 text-gray-800 p-2 rounded font-mono mt-2 text-sm overflow-x-auto">
              https://sandbox-api.educreds.xyz/api/v1/standard
            </div>
          </CardContent>
        </Card>

        {/* Auth & Quotas */}
        <Card id="getting-api-keys">
          <CardHeader>
            <CardTitle>Authentication, Subscriptions & Quotas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-3">
                EduCreds APIs are fronted by **API keys** and **institution subscriptions**. PoIC-based governance remains on-chain and
                neutral; it is never coupled to billing or quotas.
              </p>
              <div className="bg-gray-900 text-white p-4 rounded font-mono mb-4 text-sm overflow-x-auto">
                Authorization: Bearer YOUR_API_KEY{"\n"}
                X-Institution-ID: YOUR_INSTITUTION_ID
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold">How to get API keys</h4>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Visit the Developer Portal and register a developer account.</li>
                  <li>Receive your client credentials via <code className="bg-gray-100 px-1 rounded">/api/developer-portal/register</code>.</li>
                  <li>Use the issued API key in the <code className="bg-gray-100 px-1 rounded">Authorization</code> header.</li>
                </ol>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => window.open("/developer-portal/index.html", "_blank")}
                >
                  Open Developer Portal
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Subscriptions vs PoIC (at a glance)</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Subscriptions</strong>: control API calls/month, certificates/month, and access to batch endpoints (off-chain).
                  </li>
                  <li>
                    <strong>PoIC</strong>: controls institutional trust, voting power, and long-term issuance credibility (on-chain).
                  </li>
                  <li>Both must pass for a high-volume issuer, but they never mix concerns.</li>
                </ul>
                <a
                  href="/docs/SUBSCRIPTIONS_AND_USAGE"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Read subscriptions & usage architecture
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-8">
          {/* Issue Certificate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Issue Certificate
                <Badge className="bg-green-100 text-green-800">POST</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto">
                  POST /certificates/issue
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "student": {
    "id": "student_123",
    "name": "John Doe"
  },
  "course": {
    "name": "Computer Science Degree",
    "code": "CS101"
  },
  "achievement": {
    "grade": "First Class",
    "completionDate": "2024-06-15",
    "certificateType": "DIPLOMA"
  }
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response:</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "certificateId": "cert_789",
    "verificationUrl": "https://verify.educreds.xyz/credential/cert_789",
    "formats": {
      "w3c": { /* W3C VC Object */ },
      "legacy": {
        "ipfsHash": "QmX7Y8Z9...",
        "certificateNumber": "cert_789"
      }
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verify Certificate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Verify Certificate
                <Badge className="bg-blue-100 text-blue-800">POST</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto">
                  POST /certificates/verify
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Body (W3C VC):</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "w3cCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "urn:uuid:12345",
    "type": ["VerifiableCredential"],
    "issuer": "did:educreds:institution:abc123",
    "credentialSubject": { /* credential data */ }
  }
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Body (Legacy):</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "credentialId": "cert_789"
  // OR
  "ipfsHash": "QmX7Y8Z9..."
  // OR  
  "tokenId": 12345
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Institution Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Get Institution Certificates
                <Badge className="bg-blue-100 text-blue-800">GET</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto">
                  GET /institutions/&#123;institutionId&#125;/certificates?page=1&amp;limit=50
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response:</h4>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "cert_789",
        "student": { "name": "John Doe" },
        "course": { "name": "Computer Science" },
        "achievement": { "grade": "First Class" },
        "verificationUrl": "https://verify.educreds.xyz/credential/cert_789"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Error Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">HTTP Status Codes:</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">200</code> - Success
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">400</code> - Bad Request
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">401</code> - Unauthorized
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">404</code> - Not Found
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">429</code> - Usage Limit Exceeded
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded">500</code> - Internal Server Error
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Error Response Format:</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field"
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Developer Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Getting Started</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="/developer-portal/index.html"
                      target="_blank"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Developer Portal
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://docs.educreds.xyz/educreds/api-documentation/educreds-standard-education-api-v1.0"
                      target="_blank"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Standard API Specification
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="mailto:developers@educreds.xyz" className="text-blue-600 hover:underline">
                      developers@educreds.xyz
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiReferencePage;
