import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Code, Key, Zap } from "lucide-react";

const ApiReferencePage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">EduCreds API Reference</h1>
          <p className="text-xl mb-8">Integrate educational credentials into your platform with our RESTful API</p>
          <div className="flex justify-center space-x-4">
            <Button 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.open('https://developers.educreds.xyz', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Developer Portal
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Key className="h-4 w-4 mr-2" />
              Get API Key
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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
              <h3 className="font-semibold mb-2">Secure Auth</h3>
              <p className="text-sm text-gray-600">API key and JWT authentication</p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <ExternalLink className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Easy Integration</h3>
              <p className="text-sm text-gray-600">SDKs for popular platforms</p>
            </CardContent>
          </Card>
        </div>

        {/* Base URL */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-white p-4 rounded font-mono">
              https://api.educreds.xyz/api/v1/standard
            </div>
            <p className="text-sm text-gray-600 mt-2">
              All API requests should be made to this base URL. For testing, use our sandbox environment:
            </p>
            <div className="bg-gray-100 text-gray-800 p-2 rounded font-mono mt-2">
              https://sandbox-api.educreds.xyz/api/v1/standard
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">EduCreds API uses API key authentication. Include your API key in the request headers:</p>
            <div className="bg-gray-900 text-white p-4 rounded font-mono mb-4">
              Authorization: Bearer YOUR_API_KEY<br/>
              X-Institution-ID: YOUR_INSTITUTION_ID
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm">
                <strong>Get API Keys:</strong> Visit our{" "}
                <a href="https://developers.educreds.xyz" target="_blank" className="text-blue-600 hover:underline">
                  Developer Portal
                </a>{" "}
                to register and get your API credentials.
              </p>
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
                <div className="bg-gray-900 text-white p-3 rounded font-mono">
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
                <div className="bg-gray-900 text-white p-3 rounded font-mono">
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
                <div className="bg-gray-900 text-white p-3 rounded font-mono">
                  GET /institutions/&#123;institutionId&#125;/certificates?page=1&limit=50
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Error Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">HTTP Status Codes:</h4>
                <ul className="space-y-1 text-sm">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">200</code> - Success</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">400</code> - Bad Request</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">401</code> - Unauthorized</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">404</code> - Not Found</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">500</code> - Internal Server Error</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Error Response Format:</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm">
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

        {/* SDKs and Integration */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>SDKs & Integration Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">JavaScript/Node.js</h4>
                <pre className="bg-gray-900 text-white p-3 rounded text-sm">
{`npm install @educreds/sdk

const educreds = new EduCreds({
  apiKey: 'your_key',
  institutionId: 'your_id'
});

const cert = await educreds
  .issueCertificate(data);`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">PHP</h4>
                <pre className="bg-gray-900 text-white p-3 rounded text-sm">
{`composer require educreds/sdk

$educreds = new EduCreds\\Client([
  'api_key' => 'your_key',
  'institution_id' => 'your_id'
]);

$cert = $educreds
  ->issueCertificate($data);`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Python</h4>
                <pre className="bg-gray-900 text-white p-3 rounded text-sm">
{`pip install educreds-sdk

from educreds import Client

client = Client(
  api_key='your_key',
  institution_id='your_id'
)

cert = client.issue_certificate(data)`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Developer Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Getting Started</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="https://developers.educreds.xyz" target="_blank" className="text-blue-600 hover:underline flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Developer Portal
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.educreds.xyz" target="_blank" className="text-blue-600 hover:underline flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Full Documentation
                    </a>
                  </li>
                  <li>
                    <a href="https://sandbox-api.educreds.xyz" target="_blank" className="text-blue-600 hover:underline flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Sandbox Environment
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="mailto:developers@educreds.xyz" className="text-blue-600 hover:underline">
                      developers@educreds.xyz
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/educreds/examples" target="_blank" className="text-blue-600 hover:underline flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Code Examples
                    </a>
                  </li>
                  <li>
                    <a href="https://status.educreds.xyz" target="_blank" className="text-blue-600 hover:underline flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      API Status
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
