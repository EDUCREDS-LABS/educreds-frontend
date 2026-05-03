import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from '../../config/api';

export default function MarketplaceVerify() {
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setError("Invalid verification link");
      setIsVerifying(false);
      return;
    }

    verifyMagicLink(token);
  }, []);

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await fetch(`${API_CONFIG.CERT}/marketplace-auth/verify?token=${token}`);
      const data = await response.json();

      if (data.success) {
        // Store the JWT token
        localStorage.setItem('marketplace_token', data.token);
        setSuccess(true);
        
        toast({
          title: "Verification successful!",
          description: "You have been signed in to the marketplace.",
        });

        // Redirect to marketplace after a short delay
        setTimeout(() => {
          setLocation('/marketplace');
        }, 2000);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err: any) {
      setError("Failed to verify magic link. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          {isVerifying ? (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <CardTitle className="text-2xl font-bold">Verifying...</CardTitle>
              <p className="text-neutral-600">
                Please wait while we verify your magic link.
              </p>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-green-700">Success!</CardTitle>
              <p className="text-neutral-600">
                You have been successfully signed in. Redirecting to marketplace...
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-red-700">Verification Failed</CardTitle>
              <p className="text-neutral-600">
                There was an issue verifying your magic link.
              </p>
            </>
          )}
        </CardHeader>
        
        {error && (
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/marketplace/login')} 
                className="w-full"
              >
                Back to Login
              </Button>
              <Button 
                onClick={() => setLocation('/marketplace')} 
                variant="outline"
                className="w-full"
              >
                Back to Marketplace
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}