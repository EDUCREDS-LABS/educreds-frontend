import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import OtpInput from "@/components/ui/otp-input";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function RegisterVerifyOtp() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [pendingData, setPendingData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get email from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }

    // Get pending registration data
    const stored = sessionStorage.getItem('pendingRegistration');
    if (stored) {
      setPendingData(JSON.parse(stored));
    } else {
      // No pending registration, redirect back
      setLocation('/register');
    }
  }, [setLocation]);

  const handleOtpVerify = async (otp: string, otpToken: string) => {
    if (!pendingData) {
      setError("Registration data not found. Please start registration again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Complete registration with OTP
      const { confirmPassword, otpToken: _, ...registrationData } = pendingData;
      const payload = { 
        ...registrationData, 
        role: "institution",
        otp,
        otpToken
      };

      const response = await api.register(payload);
      auth.setToken(response.token);
      
      // Clear pending data
      sessionStorage.removeItem('pendingRegistration');
      
      toast({
        title: "Registration successful!",
        description: "Your institution has been registered. Verification request submitted.",
      });
      
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      throw new Error("Email not found");
    }

    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/auth/institution/send-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      throw new Error('Failed to resend OTP');
    }
    
    const { otpToken } = await response.json();
    
    // Update pending data with new token
    if (pendingData) {
      const updatedData = { ...pendingData, otpToken };
      setPendingData(updatedData);
      sessionStorage.setItem('pendingRegistration', JSON.stringify(updatedData));
    }
    
    return { otpToken };
  };

  if (!pendingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Registration Data Not Found</h2>
            <p className="text-neutral-600 mb-4">Please start the registration process again.</p>
            <Link href="/register">
              <Button className="w-full">Back to Registration</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute top-4 left-4">
        <Link href="/register">
          <Button variant="ghost" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Registration</span>
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="url(#otp-logo-gradient)" />
                <path d="M10 22L16 10L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="otp-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                EduCreds
              </h1>
            </div>
            
            <CardTitle className="text-2xl font-bold text-neutral-900">
              Verify Your Email
            </CardTitle>
            <p className="text-neutral-600">
              Enter the verification code sent to {email}
            </p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <OtpInput
              email={email}
              type="register"
              onVerify={handleOtpVerify}
              onResend={handleResendOtp}
              isLoading={isLoading}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Didn't receive the code?{" "}
                <button 
                  onClick={() => handleResendOtp().then(() => toast({ title: "OTP Resent", description: "Check your email for the new code" }))}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}