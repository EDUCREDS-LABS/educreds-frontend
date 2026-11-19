import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '../../config/api';

const CERT_API_BASE = (API_CONFIG.CERT).replace(/\/$/, '');

export default function PendingApprovalPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${CERT_API_BASE}/api/session/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setSessionInfo(data);
        } else {
          // No valid session, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${CERT_API_BASE}/api/session/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <Clock className="w-12 h-12 animate-spin mx-auto text-blue-500" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Clock className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
          <CardTitle>Access Request Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Your access request is pending administrator approval.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{sessionInfo?.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Institution</p>
              <p className="font-medium">{sessionInfo?.institutionId}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>An administrator from your institution will review your request</li>
              <li>You will receive an email confirmation once approved</li>
              <li>You can then sign in with full access</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This typically takes 24-48 hours. If you have questions, contact your institution's administrator.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
