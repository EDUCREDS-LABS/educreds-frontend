import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG } from '../config/api';

export default function W3CTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSubscriptionEndpoints = async () => {
    setLoading(true);
    try {
      const plans = await api.getSubscriptionPlans();
      setResult({ type: 'Subscription Plans', data: plans });
    } catch (error) {
      setResult({ type: 'Error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const testW3CIssuance = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/w3c-credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDID: 'did:educreds:student:demo123',
          institutionDID: 'did:educreds:institution:demo456',
          institutionName: 'Demo University',
          courseName: 'Software Engineering',
          grade: 'A+',
          completionDate: '2024-06-15',
          certificateType: 'Academic'
        })
      });
      const data = await response.json();
      setResult({ type: 'W3C Credential Issued', data });
    } catch (error) {
      setResult({ type: 'Error', data: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">EduCreds W3C VC Integration Test</h1>
          <p className="text-gray-600">Test the new W3C Verifiable Credentials features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Subscription System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the fixed subscription endpoints that were missing
              </p>
              <Button onClick={testSubscriptionEndpoints} disabled={loading}>
                Test Subscription Plans
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test W3C VC Issuance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Issue a W3C Verifiable Credential with DIDs
              </p>
              <Button onClick={testW3CIssuance} disabled={loading}>
                Issue W3C Credential
              </Button>
            </CardContent>
          </Card>
        </div>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Test Result: {result.type}
                <Badge variant="outline">
                  {result.data.error ? 'Error' : 'Success'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Backend Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• W3C Verifiable Credentials</li>
                  <li>• DID Generation</li>
                  <li>• Subscription Endpoints</li>
                  <li>• Student Sharing Service</li>
                  <li>• Hybrid Verification</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✅ Frontend Components</h4>
                <ul className="text-sm space-y-1">
                  <li>• Enhanced Student Dashboard</li>
                  <li>• Certificate Sharing Interface</li>
                  <li>• Verification Portal</li>
                  <li>• QR Code Generation</li>
                  <li>• Multiple Sharing Formats</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}