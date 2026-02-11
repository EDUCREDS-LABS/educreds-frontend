import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OtpInput from "@/components/ui/otp-input";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Zap,
  Users,
  Globe,
  Eye,
  EyeOff,
  Wallet,
  Mail
} from "lucide-react";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

const CERT_API_BASE = (import.meta.env.VITE_CERT_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");

const features = [
  {
    icon: Shield,
    title: "Secure & Fraud-Proof",
    description: "Blockchain technology ensures certificates cannot be forged"
  },
  {
    icon: Zap,
    title: "Instant Verification",
    description: "Verify certificates in seconds, anywhere in the world"
  },
  {
    icon: Users,
    title: "Trusted by 500+ Institutions",
    description: "Join thousands of educational institutions worldwide"
  },
  {
    icon: Globe,
    title: "Global Recognition",
    description: "Certificates recognized internationally"
  }
];

interface WalletLoginData {
  walletAddress: string;
  message: string;
}

export default function ModernAuthUnified() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<"wallet" | "email">("email");
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, disconnect, isLoading: walletLoading } = useWallet();

  const signMessage = async (message: string): Promise<string> => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts?.[0]) throw new Error("No account connected");
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]],
    });
    return signature as string;
  };

  const emailForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Email/Password Login
  const handleEmailLogin = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError("");

    try {
      // Send OTP
      const otpResponse = await fetch(`${CERT_API_BASE}/auth/institution/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }

      const { otpToken: token } = await otpResponse.json();
      setOtpToken(token);
      setUserEmail(data.email);
      setShowOtp(true);

      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
      });
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Wallet-based Login
  const handleWalletLogin = async () => {
    if (!isConnected || !walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const message = `Sign this message to login to EduCreds: ${Date.now()}`;

      // Sign message with wallet
      const signature = await signMessage(message);

      // Call backend login endpoint with wallet signature
      const response = await fetch(`${CERT_API_BASE}/auth/institution/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();

      // Store authentication data
      localStorage.setItem('institution_token', result.token);
      localStorage.setItem('auth_type', 'institution');
      if (result.institution) {
        localStorage.setItem('institution_user', JSON.stringify({
          id: result.institution.id,
          email: result.institution.email,
          name: result.institution.name,
          type: 'institution',
          walletAddress: result.institution.walletAddress,
          did: result.institution.did,
          isVerified: result.institution.isVerified
        }));
      }

      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChange'));

      toast({
        title: "Login successful",
        description: "Welcome back to EduCreds!",
      });

      // Redirect to dashboard
      window.location.href = '/institution/dashboard';
    } catch (err: any) {
      setError(err.message || "Wallet login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Verification (for email/password flow)
  const handleOtpVerify = async (otp: string, token: string) => {
    setIsLoading(true);
    setError("");

    try {
      const emailData = emailForm.getValues();

      // Call backend login endpoint with OTP
      const response = await fetch(`${CERT_API_BASE}/auth/institution/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailData.email,
          password: emailData.password,
          otp,
          otpToken: token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();

      // Store authentication data
      localStorage.setItem('institution_token', result.token);
      localStorage.setItem('auth_type', 'institution');
      if (result.institution) {
        localStorage.setItem('institution_user', JSON.stringify({
          id: result.institution.id,
          email: result.institution.email,
          name: result.institution.name,
          type: 'institution',
          walletAddress: result.institution.walletAddress,
          did: result.institution.did,
          isVerified: result.institution.isVerified
        }));
      }

      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChange'));

      toast({
        title: "Login successful",
        description: "Welcome back to EduCreds!",
      });

      // Redirect to dashboard
      window.location.href = '/institution/dashboard';
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`${CERT_API_BASE}/auth/institution/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });

      if (!response.ok) throw new Error('Failed to resend OTP');

      const { otpToken: token } = await response.json();
      setOtpToken(token);
      return { otpToken: token };
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="ghost" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 bg-gradient-to-br from-primary/10 to-purple-500/10">
          <div className="max-w-md">
            <div className="flex items-center space-x-2 mb-8">
              <img src="/logo.png" alt="EduCreds" className="h-10 w-auto" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                EduCreds
              </h1>
            </div>

            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              The Future of Educational Certificates
            </h2>
            <p className="text-lg text-neutral-600 mb-8">
              Issue, verify, and manage educational certificates with blockchain technology.
              Join the revolution in academic credential verification.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-neutral-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-white/50 rounded-lg border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Trusted
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  SOC 2 Compliant
                </Badge>
              </div>
              <p className="text-sm text-neutral-600">
                Enterprise-grade security with 99.9% uptime guarantee
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                <img src="/logo.png" alt="EduCreds" className="h-6 w-auto" />
                <span className="text-lg font-bold text-neutral-900">EduCreds</span>
              </div>

              <CardTitle className="text-2xl font-bold text-neutral-900">
                Welcome Back
              </CardTitle>
              <p className="text-neutral-600">
                Sign in to your institution dashboard
              </p>
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
                    onClick={() => {
                      setShowOtp(false);
                      setError("");
                    }}
                    variant="outline"
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <Tabs value={loginMethod} onValueChange={(v) => {
                  setLoginMethod(v as "wallet" | "email");
                  setError("");
                  emailForm.reset();
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <span className="hidden sm:inline">Wallet</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Email/Password Login */}
                  <TabsContent value="email">
                    <Form {...emailForm}>
                      <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <FormField
                          control={emailForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="admin@university.edu"
                                  {...field}
                                  className="h-11"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    {...field}
                                    className="h-11 pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-between text-sm">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded border-neutral-300" />
                            <span className="text-neutral-600">Remember me</span>
                          </label>
                          <Link href="/forgot-password">
                            <button type="button" className="text-primary hover:underline">
                              Forgot password?
                            </button>
                          </Link>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                          disabled={isLoading}
                        >
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send OTP & Sign In
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Wallet Login */}
                  <TabsContent value="wallet">
                    <div className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-start">
                          <Wallet className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Connect your institution's blockchain wallet to sign in securely</span>
                        </p>
                      </div>

                      {!isConnected ? (
                        <Button
                          onClick={connect}
                          disabled={walletLoading}
                          className="w-full h-11 bg-gradient-to-r from-primary to-purple-600"
                        >
                          {walletLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Wallet className="mr-2 h-4 w-4" />
                              Connect MetaMask
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm font-medium text-green-900">Wallet Connected</p>
                            </div>
                            <p className="text-xs text-green-700 font-mono truncate">
                              {walletAddress}
                            </p>
                          </div>

                          <Button
                            onClick={handleWalletLogin}
                            disabled={isLoading}
                            className="w-full h-11 bg-gradient-to-r from-primary to-purple-600"
                          >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Signing..." : "Sign In with Wallet"}
                          </Button>

                          <Button
                            onClick={disconnect}
                            variant="outline"
                            className="w-full h-11"
                            disabled={isLoading}
                          >
                            Disconnect Wallet
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {!showOtp && (
                <>
                  <p className="text-sm text-neutral-600 mt-6">
                    Don't have an account?{" "}
                    <Link href="/register">
                      <button className="text-primary hover:underline font-medium">
                        Register your institution
                      </button>
                    </Link>
                  </p>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-neutral-600">
                      Are you a student?{" "}
                      <Link href="/student">
                        <button className="text-secondary hover:underline font-medium">
                          Access Student Portal
                        </button>
                      </Link>
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 mb-2">Quick Access</p>
                      <div className="flex gap-2">
                        <Link href="/verify" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Verify Certificate
                          </Button>
                        </Link>
                        <Link href="/marketplace" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Browse Templates
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
