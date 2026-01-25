import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
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
  EyeOff
} from "lucide-react";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const CERT_API_BASE = (import.meta.env.VITE_CERT_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");

interface ModernAuthProps {
  mode: 'login' | 'register';
}

export default function ModernAuth({ mode }: ModernAuthProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError("");

    try {
      // First, send OTP
      const otpResponse = await fetch(`${CERT_API_BASE}/auth/institution/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      if (!otpResponse.ok) throw new Error('Failed to send OTP');

      const { otpToken } = await otpResponse.json();
      setOtpToken(otpToken);
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

  const handleOtpVerify = async (otp: string, token: string) => {
    setIsLoading(true);
    setError("");

    try {
      const formData = form.getValues();
      const response = await api.login({
        ...formData,
        otp,
        otpToken: token
      });

      // Store authentication data properly
      localStorage.setItem('institution_token', response.token);
      localStorage.setItem('auth_type', 'institution');
      if (response.institution) {
        // Use the MongoDB _id if available, otherwise use id
        const institutionId = response.institution._id || response.institution.id;
        localStorage.setItem('institution_user', JSON.stringify({
          id: institutionId,
          email: response.institution.email,
          name: response.institution.name,
          type: 'institution',
          walletAddress: response.institution.walletAddress,
          isVerified: response.institution.isVerified
        }));
      }

      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChange'));

      toast({
        title: "Login successful",
        description: "Welcome back to EduCreds!",
      });

      // Force redirect to dashboard
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';

    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const response = await fetch(`${CERT_API_BASE}/auth/institution/send-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });

    if (!response.ok) throw new Error('Failed to resend OTP');

    const { otpToken } = await response.json();
    return { otpToken };
  };

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
                {mode === 'login' ? 'Welcome Back' : 'Get Started'}
              </CardTitle>
              <p className="text-neutral-600">
                {mode === 'login'
                  ? 'Sign in to your institution dashboard'
                  : 'Create your institution account'
                }
              </p>
            </CardHeader>

            <CardContent>
              {showOtp ? (
                <OtpInput
                  email={userEmail}
                  type="login"
                  onVerify={handleOtpVerify}
                  onResend={handleResendOtp}
                  isLoading={isLoading}
                  otpToken={otpToken}
                />
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
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
                      control={form.control}
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

                    {mode === 'login' && (
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
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              )}

              {!showOtp && (
                <>
                  <p className="text-sm text-neutral-600">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <Link href={mode === 'login' ? '/register' : '/login'}>
                      <button className="text-primary hover:underline font-medium">
                        {mode === 'login' ? 'Register your institution' : 'Sign in here'}
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

                  {mode === 'login' && (
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}