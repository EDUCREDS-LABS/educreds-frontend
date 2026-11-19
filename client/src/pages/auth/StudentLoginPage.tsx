import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import OtpInput from "@/components/ui/otp-input";
import { Loader2, AlertCircle, ArrowLeft, GraduationCap, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setAuthItem } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";
import { FirebaseAuth } from "@/lib/firebaseAuth";
import { AuthType } from "@/lib/dualAuth";
import { useWallet } from "@/hooks/useWallet";

// Simplified schema for student email login
const studentLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type StudentLoginCredentials = z.infer<typeof studentLoginSchema>;

const API_BASE = API_CONFIG.CERT;

// Google G icon (inline SVG — avoids adding a dep)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

export default function StudentLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<null | 'google' | 'university'>(null);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showWalletOption, setShowWalletOption] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, isLoading: walletLoading } = useWallet();

  const form = useForm<StudentLoginCredentials>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: "",
    },
  });

  const finalizeStudentSession = (result: {
    token: string;
    identity: { eduCredsId: string; email: string; firstName?: string | null; lastName?: string | null };
  }) => {
    setAuthItem('student_token', result.token);
    setAuthItem('auth_type', AuthType.STUDENT);
    setAuthItem('student_user', JSON.stringify(result.identity));
    window.dispatchEvent(new CustomEvent('authStateChange'));
    toast({
      title: "Signed in",
      description: `Welcome, ${result.identity.email}`,
    });
    navigate(`/student/dashboard`, { replace: true });
  };

  const handleGoogleSso = async () => {
    setError('');
    setSsoLoading('google');
    try {
      const { token: firebaseIdToken } = await FirebaseAuth.signInWithGoogle();
      const response = await fetch(`${API_BASE}/api/identity/login/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken, provider: 'google' }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Student SSO endpoint is not available on this backend.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Google sign-in failed.');
      }
      const result = await response.json();
      finalizeStudentSession(result);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setSsoLoading(null);
    }
  };

  const handleUniversitySso = async () => {
    setError('');
    setSsoLoading('university');
    try {
      // University SSO is bridged via the institution's IdP → Firebase custom token.
      // For institutions not yet federated, we surface a helpful message rather
      // than a silent 404.
      const { token: firebaseIdToken } = await FirebaseAuth.signInWithGoogle();
      const response = await fetch(`${API_BASE}/api/identity/login/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken, provider: 'university' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            'University SSO federation is not configured for your institution yet. Please use email or Google sign-in.',
        );
      }
      const result = await response.json();
      finalizeStudentSession(result);
    } catch (err: any) {
      setError(err?.message || 'University SSO failed.');
    } finally {
      setSsoLoading(null);
    }
  };

  const handleEmailSubmit = async (data: StudentLoginCredentials) => {
    setIsLoading(true);
    setError("");

    try {
      const otpResponse = await fetch(`${API_BASE}/api/identity/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      if (!otpResponse.ok) {
        if (otpResponse.status === 404) {
          throw new Error('Student email login is not enabled on this backend yet. Please use Wallet access for now.');
        }
        const errorData = await otpResponse.json();
        throw new Error(errorData.message || 'Failed to send OTP. Is your email correct?');
      }

      const { otpToken: token } = await otpResponse.json();
      setOtpToken(token);
      setUserEmail(data.email);
      setShowOtp(true);

      toast({
        title: "Verification Code Sent",
        description: "If an EduCreds identity exists for this email, a 6-digit code has been sent. Check your inbox.",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string, token: string) => {
    setIsLoading(true);
    setError("");

    try {
      // API call to verify OTP and log in
      const response = await fetch(`${API_BASE}/api/identity/login/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          otp,
          otpToken: token,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Student email verification endpoint is not available yet.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed. Invalid code?');
      }

      const result = await response.json();
      finalizeStudentSession(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/identity/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      if (response.status === 404) {
        throw new Error('Student email login is not enabled on this backend yet.');
      }
      if (!response.ok) throw new Error('Failed to resend OTP');
      const { otpToken: token } = await response.json();
      setOtpToken(token);
      return { otpToken: token };
    } catch (err) {
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
      throw err;
    }
  };

  const handleWalletLogin = async () => {
    setError('');
    try {
      if (!isConnected) {
        await connect();
        return;
      }
      if (!walletAddress) {
        setError('No wallet address detected after connecting.');
        return;
      }
      const response = await fetch(`${API_BASE}/api/identity/login/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No EduCreds identity found for this wallet address.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Wallet login failed.');
      }
      const result = await response.json();
      finalizeStudentSession(result);
    } catch (err: any) {
      setError(err?.message || 'Wallet login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/">
            <img src="/logo.png" alt="EduCreds" className="h-12 w-auto mx-auto mb-2" />
          </Link>
          <h1 className="text-2xl font-bold">Student Portal</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your Identity</CardTitle>
            <CardDescription>
              Access your claimed credentials and manage your EduCreds ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showOtp ? (
              <div className="space-y-4">
                <OtpInput
                  email={userEmail}
                  type="login"
                  onVerify={handleOtpVerify}
                  onResend={handleResendOtp}
                  isLoading={isLoading}
                  otpToken={otpToken}
                />
                <Button
                  type="button"
                  onClick={() => setShowOtp(false)}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Email
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-xl border-neutral-200 dark:border-neutral-800 gap-2 font-bold"
                      onClick={handleGoogleSso}
                      disabled={ssoLoading !== null || isLoading}
                      data-testid="student-google-sso-button"
                    >
                      {ssoLoading === 'google' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GoogleIcon />
                      )}
                      <span className="text-sm">Continue with Google</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-xl border-neutral-200 dark:border-neutral-800 gap-2 font-bold"
                      onClick={handleUniversitySso}
                      disabled={ssoLoading !== null || isLoading}
                      data-testid="student-university-sso-button"
                    >
                      {ssoLoading === 'university' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GraduationCap className="h-4 w-4" />
                      )}
                      <span className="text-sm">University SSO</span>
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                      <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-500 font-bold">Or continue with email</span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In with Email
                  </Button>

                  {/* Wallet connect — advanced option */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWalletOption((v) => !v)}
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium mx-auto"
                    >
                      {showWalletOption ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      Advanced: sign in with wallet
                    </button>

                    {showWalletOption && (
                      <div className="mt-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 space-y-3">
                        <p className="text-xs text-neutral-500 text-center">
                          Connect your Ethereum wallet to access your EduCreds identity directly.
                        </p>
                        {isConnected && walletAddress && (
                          <p className="text-xs font-mono text-center text-neutral-600 dark:text-neutral-400 truncate">
                            {walletAddress}
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11 rounded-xl gap-2 font-bold"
                          onClick={handleWalletLogin}
                          disabled={walletLoading}
                        >
                          {walletLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wallet className="h-4 w-4" />
                          )}
                          {isConnected ? 'Sign in with Connected Wallet' : 'Connect Wallet'}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            )}
            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">
                Are you an institution? Sign in here.
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
