import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  url: string;
  status: 'success' | 'error' | 'pending';
  response?: any;
  error?: string;
}

export const SystemTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const testEndpoints = [
    { name: 'API Health Check', url: '/api/test/health' },
    { name: 'Available Routes', url: '/api/test/routes' },
    { name: 'Subscription Service', url: '/api/subscription/plans' },
    { name: 'Usage Tracking', url: '/api/subscription/usage' },
    { name: 'Standard API Health', url: '/api/v1/standard/health' },
    { name: 'Unified API Methods', url: '/api/v1/unified/methods' }
  ];

  const runTests = async () => {
    setRunning(true);
    const results: TestResult[] = [];

    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint.url);
        const data = await response.json();
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.ok ? 'success' : 'error',
          response: data,
          error: response.ok ? undefined : `HTTP ${response.status}`
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'error',
          error: error.message
        });
      }
    }

    setTests(results);
    setRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: { label: 'Success', className: 'bg-green-100 text-green-800 border-green-200' },
      error: { label: 'Error', className: 'bg-red-100 text-red-800 border-red-200' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    };

    const { label, className } = config[status] || config.pending;
    return <Badge className={`${className} border`}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Connectivity Test</h1>
          <p className="text-gray-600 mt-2">
            Testing all API endpoints and new features
          </p>
        </div>

        <div className="mb-6">
          <Button onClick={runTests} disabled={running}>
            {running ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>

        <div className="grid gap-4">
          {tests.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <p className="text-sm text-gray-600">{test.url}</p>
                    </div>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                {test.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                    <p className="text-sm text-red-700">Error: {test.error}</p>
                  </div>
                )}
                {test.response && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-sm text-gray-700 overflow-auto">
                      {JSON.stringify(test.response, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => window.location.href = '/certificate-issuance'}>
                  Certificate Issuance
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/certificate-management'}>
                  Certificate Management
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/template-designer'}>
                  Template Designer
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/usage'}>
                  Usage & Billing
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/bulk-issuance'}>
                  Bulk Issuance
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/pdf-certificates'}>
                  PDF Certificates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemTest;