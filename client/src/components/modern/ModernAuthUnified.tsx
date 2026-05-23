import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from '../../config/api';

// Ethereum provider type declaration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}
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

const CERT_API_BASE = (API_CONFIG.CERT).replace(/\/$/, "");

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
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, disconnect, isLoading: walletLoading } = useWallet();

  const signMessage = async (message: string): Promise<string> => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
    if (!accounts?.[0]) throw new Error("No account connected");
    const signature = await (window.ethereum as any).request({
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

  useEffect(() => {
    const remembered = localStorage.getItem('remembered_email');
    if (remembered) {
      emailForm.setValue('email', remembered);
      setRememberMe(true);
    }
  }, [emailForm]);

  // Email/Password Login
  const handleEmailLogin = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError("");

    try {
      // Send OTP (now passing password for backend validation before OTP is triggered)
      const otpResponse = await fetch(`${CERT_API_BASE}/auth/institution/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: data.email,
          password: data.password // Added password validation before OTP trigger
        })
      });

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json();
        throw new Error(errorData.message || 'Invalid email or password');
      }

      const { otpToken: token } = await otpResponse.json();
      setOtpToken(token);
      setUserEmail(data.email);
      setShowOtp(true);

      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

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
      setLocation('/institution/dashboard');
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
      setLocation('/institution/dashboard');
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
          <Card className="w-full max-w-md shadow-2xl border-none rounded-[40px] bg-white dark:bg-neutral-900 p-8">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                <img src="/logo.png" alt="EduCreds" className="h-6 w-auto" />
                <span className="text-lg font-bold text-neutral-900">EduCreds</span>
              </div>

              <CardTitle className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
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
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg"
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
                                  className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
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
                                    className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pr-10"
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
                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded border-neutral-300 text-primary focus:ring-primary transition-colors" 
                            />
                            <span className="text-neutral-600 group-hover:text-neutral-900 transition-colors">Remember me</span>
                          </label>
                          <Link href="/forgot-password">
                            <button type="button" className="text-primary hover:underline font-medium transition-all">
                              Forgot password?
                            </button>
                          </Link>
                        </div>

                        <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send OTP & Sign In
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Wallet Login */}
                  <TabsContent value="wallet">
                    <div className="space-y-6">
                      {isConnected ? (
                        <div className="space-y-6">
                          {error && (
                            <Alert variant="destructive" className="rounded-2xl">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}

                          <div className="p-6 rounded-[24px] bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-500/20">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="size-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <Wallet className="size-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Active Identity</p>
                                <p className="text-xs font-bold text-emerald-600">Protocol Synchronized</p>
                              </div>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-white dark:border-white/5">
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Wallet Address</p>
                              <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                                {walletAddress}
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={handleWalletLogin}
                            disabled={isLoading}
                            className="w-full h-16 rounded-[24px] bg-neutral-900 hover:bg-black dark:bg-white dark:text-neutral-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all"
                          >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Shield className="mr-2 h-5 w-5" />}
                            {isLoading ? "Synchronizing..." : "Authorize Identity"}
                          </Button>

                          <Button
                            onClick={disconnect}
                            variant="ghost"
                            className="w-full h-14 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-red-500 transition-colors"
                            disabled={isLoading}
                          >
                            Disconnect Authority
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {error && (
                            <Alert variant="destructive" className="rounded-2xl">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}

                          <div className="p-8 rounded-[32px] bg-neutral-50 dark:bg-neutral-800 border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-center space-y-4">
                            <div className="size-16 bg-white dark:bg-neutral-900 rounded-[24px] shadow-xl flex items-center justify-center mx-auto text-primary">
                              <Wallet className="size-8" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-black tracking-tight">Connect Wallet.</h3>
                              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                                Authorize your institutional identity through the blockchain protocol to access the network dashboard.
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={connect}
                            disabled={walletLoading}
                            className="w-full h-16 rounded-[24px] bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                          >
                            {walletLoading ? (
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <Zap className="mr-2 h-5 w-5" />
                            )}
                            {walletLoading ? "Connecting..." : "Initialize Protocol"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Authorized Access Only
                  </p>
                  <div className="flex justify-center gap-6">
                    <Link href="/register" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Register Institution</Link>
                    <Link href="/student-portal" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Student Access</Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
