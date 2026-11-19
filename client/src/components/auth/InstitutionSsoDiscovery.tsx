import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import { API_CONFIG } from '../../config/api';

const CERT_API_BASE = (API_CONFIG.CERT).replace(/\/$/, '');

export default function InstitutionSsoDiscovery() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${CERT_API_BASE}/api/public/institutions/resolve-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Failed to resolve institution');
      }

      const data = await res.json();

      if (data.ssoEnabled && data.ssoStartUrl) {
        // Redirect to B2C
        window.location.href = data.ssoStartUrl;
      } else {
        setError('SSO is not enabled for this institution. Please use email/password or wallet login.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve institution');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Sign in with Institution Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDiscover} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Institution Email</label>
            <Input
              type="email"
              placeholder="user@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your institution email to sign in with your university account
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Continue with SSO'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
