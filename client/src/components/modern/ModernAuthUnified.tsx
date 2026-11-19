import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from '../../config/api';

// Ethereum provider type declaration - extends the base Record<string, unknown> declared by wagmi/viem
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
import { getInstitutionTierDestination } from "@/lib/deploymentTier";
import { jwtDecode } from "jwt-decode";
import { setAuthItem } from "@/lib/authStorage";

const CERT_API_BASE = (API_CONFIG.CERT).replace(/\/$/, "");

const features = [
  { icon: Shield, title: "Signed at issuance", description: "Every credential carries your institution's cryptographic signature and DID." },
  { icon: Zap, title: "Independent verification", description: "Employers check authenticity and status without contacting your registry." },
  { icon: Users, title: "Your team, your controls", description: "Invite staff with scoped access to issuance, records and settings." },
  { icon: Globe, title: "Open standards", description: "W3C Verifiable Credentials that travel with the graduate." },
];

interface WalletLoginData {
  walletAddress: string;
  message: string;
}

export default function ModernAuthUnified({ embedded = false }: { embedded?: boolean } = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<"wallet" | "email">("email");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, disconnect, isLoading: walletLoading } = useWallet();

  // The email+OTP login response omits deploymentTier; the signed token carries it.
  const tierFromToken = (token?: string): string | undefined => {
    try { return token ? jwtDecode<{ deploymentTier?: string }>(token).deploymentTier : undefined; } catch { return undefined; }
  };

  const buildInstitutionUser = (institution: any, token?: string) => ({
    id: institution.id,
    email: institution.email,
    name: institution.name,
    type: 'institution',
    walletAddress: institution.walletAddress,
    did: institution.did,
    isVerified: institution.isVerified,
    deploymentTier: institution.deploymentTier ?? tierFromToken(token) ?? 'workspace',
    connectorApiUrl: institution.connectorApiUrl,
    connectorEndpoint: institution.connectorEndpoint,
  });

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
      setAuthItem('institution_token', result.token);
      setAuthItem('auth_type', 'institution');
      if (result.institution) {
        setAuthItem('institution_user', JSON.stringify(buildInstitutionUser(result.institution, result.token)));
      }

      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChange'));

      toast({
        title: "Login successful",
        description: "Welcome back to EduCreds!",
      });

      // Route through the workspace resolver (Select Workspace). Single-workspace
      // users are redirected to their home by the resolver; multi-workspace
      // users see the picker. This keeps the "who" layer as the entry point.
      navigate("/select-workspace", { replace: true });
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
      setAuthItem('institution_token', result.token);
      setAuthItem('auth_type', 'institution');
      if (result.institution) {
        setAuthItem('institution_user', JSON.stringify(buildInstitutionUser(result.institution, result.token)));
      }

      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChange'));

      toast({
        title: "Login successful",
        description: "Welcome back to EduCreds!",
      });

      // Route through the workspace resolver (Select Workspace). Single-workspace
      // users are redirected to their home by the resolver; multi-workspace
      // users see the picker. This keeps the "who" layer as the entry point.
      navigate("/select-workspace", { replace: true });
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

  const authCard = (
          <div className="w-full max-w-md border border-[#E6E2DA] bg-white p-8 sm:p-10">
            <div className="pb-6">
              <div className="lg:hidden mb-6 flex items-center gap-2">
                <img src="/logo.svg" alt="EduCreds" className="h-6 w-auto" />
                <span className="text-[15px] font-bold text-[#0B1220]">EduCreds</span>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
                Institution
              </p>
              <h2 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.02em] text-[#0B1220]">
                Welcome back
              </h2>
              <p className="mt-2 text-[14px] text-[#6B7382]">
                Sign in to your institution dashboard
              </p>
            </div>

            <div>
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
                    className="w-full h-12 border border-[#E6E2DA] bg-transparent text-[13px] font-semibold text-[#0B1220]"
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
                  <TabsList className="mb-6 grid w-full grid-cols-2 rounded-none border border-[#E6E2DA] bg-transparent p-0">
                    <TabsTrigger value="email" className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#0B1220] data-[state=active]:text-white">
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="flex items-center gap-2 rounded-none data-[state=active]:bg-[#0B1220] data-[state=active]:text-white">
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
                                  className="h-12 rounded-none border-[#E6E2DA] bg-transparent"
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
                                    className="h-12 rounded-none border-[#E6E2DA] bg-transparent pr-10"
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
                          <Link to="/forgot-password">
                            <button type="button" className="text-primary hover:underline font-medium transition-all">
                              Forgot password?
                            </button>
                          </Link>
                        </div>

                        <Button type="submit" className="h-12 w-full rounded-none bg-[#0B1220] text-[13px] font-semibold tracking-tight text-white hover:bg-[#162033]" disabled={isLoading}>
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
                            {walletLoading ? "Connecting..." : "Connect wallet"}
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
                    <Link to="/register" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Register Institution</Link>
                    <Link to="/student/login" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Student Access</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );

  if (embedded) return authCard;

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-6">
        <Link
          to="https://educreds.xyz"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6B7382] transition-colors hover:text-[#0B1220]"
        >
          <ArrowLeft className="h-4 w-4" />
          educreds.xyz
        </Link>
      </div>

      <div className="flex min-h-screen">
        <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-[#060B14] p-12 lg:flex xl:p-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 70% 20%, rgba(56,98,168,0.3) 0%, transparent 55%), radial-gradient(ellipse 40% 35% at 10% 90%, rgba(201,168,76,0.08) 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10 max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-[#C9A84C]/35">
                <img src="/logo.svg" alt="" className="h-5 w-5 brightness-0 invert" />
              </span>
              <span className="text-[15px] font-bold text-white">EduCreds</span>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[#C9A84C]/70" />
              <p className="text-[11px] font-medium tracking-[0.14em] text-[#9AA8BC]">
                Institution access
              </p>
            </div>
            <h1 className="text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white">
              Sign in to issue and manage credentials.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#8B98AB]">
              Academic credentials any employer or regulator can check independently.
            </p>

            <ul className="mt-10 space-y-0 border-t border-white/10">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.title}
                    className="flex items-start gap-3 border-b border-white/10 py-4"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]" strokeWidth={1.75} />
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">{feature.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#7A8494]">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          {authCard}
        </div>
      </div>
    </div>
  );
}
