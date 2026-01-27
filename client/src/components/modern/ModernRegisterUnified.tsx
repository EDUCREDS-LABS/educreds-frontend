import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import OtpInput from "@/components/ui/otp-input";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Shield,
  Wallet,
  Building,
  Mail,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { insertInstitutionSchema, type InsertInstitution } from "@shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

const CERT_API_BASE = (import.meta.env.VITE_CERT_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");

export default function ModernRegisterUnified() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, disconnect, isLoading: walletLoading, error: walletError } = useWallet();

  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState<any>(null);

  const form = useForm<InsertInstitution>({
    resolver: zodResolver(insertInstitutionSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      walletAddress: "",
      registrationNumber: "",
      contactInfo: {
        phone: "",
        address: "",
        website: "",
      },
      plan: "Free",
    },
  });

  useEffect(() => {
    if (walletAddress) {
      form.setValue("walletAddress", walletAddress);
    }
  }, [walletAddress, form]);

  const onSubmit = async (data: InsertInstitution) => {
    if (showOtp) {
      return;
    }

    setIsLoading(true);
    setError("");

    // Validation: BOTH wallet and password required
    if (!walletAddress) {
      setError("Please connect your wallet - it's required for registration.");
      setIsLoading(false);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError("Passwords don't match.");
      setIsLoading(false);
      return;
    }

    if (!data.password || data.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      // Store form data for OTP verification
      setFormData(data);
      setUserEmail(data.email);

      // Send OTP
      const otpResponse = await fetch(`${CERT_API_BASE}/auth/institution/send-registration-otp`, {
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
      setShowOtp(true);

      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code.",
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
      // Prepare registration payload for backend
      // Backend expects: name, email, walletAddress, registrationNumber, contactInfo
      const registrationPayload = {
        name: formData.name,
        email: formData.email,
        walletAddress: walletAddress,
        registrationNumber: formData.registrationNumber,
        contactInfo: formData.contactInfo || {},
        password: formData.password, // Include password for DID wrapping
      };

      // Call backend register endpoint
      const response = await fetch(`${CERT_API_BASE}/auth/institution/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
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
        title: "Registration successful!",
        description: "Your institution has been registered. Welcome to EduCreds!",
      });

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`${CERT_API_BASE}/auth/institution/send-registration-otp`, {
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

  const nextStep = () => {
    setError("");

    if (currentStep === 1) {
      const { name, email, registrationNumber } = form.getValues();
      if (!name || !email || !registrationNumber) {
        setError("Please fill in all required fields.");
        return;
      }
    }

    if (currentStep === 2) {
      const { password, confirmPassword } = form.getValues();
      if (!password || !confirmPassword) {
        setError("Please fill in both password fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (!walletAddress) {
        setError("Please connect your wallet - it's required for the blockchain registration.");
        return;
      }
    }

    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const getStepProgress = () => (currentStep / 2) * 100;

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

      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-2xl shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img src="/logo.png" alt="EduCreds" className="h-8 w-auto" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                EduCreds
              </h1>
            </div>

            <CardTitle className="text-2xl font-bold text-neutral-900">
              Register Your Institution
            </CardTitle>
            <p className="text-neutral-600">
              Set up your institution with secure blockchain integration
            </p>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-neutral-600 mb-2">
                <span>Step {currentStep} of 2</span>
                <span>{Math.round(getStepProgress())}% Complete</span>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-4 mt-4">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 2 && (
                    <div className={`w-12 h-0.5 mx-2 ${step < currentStep ? 'bg-primary' : 'bg-neutral-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {showOtp ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Mail className="w-12 h-12 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Verify Your Email</h3>
                  <p className="text-sm text-neutral-600">Enter the code sent to {userEmail}</p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <OtpInput
                  email={userEmail}
                  type="register"
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
                  Back to Form
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Step 1: Institution Details */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <Building className="w-12 h-12 text-primary mx-auto mb-2" />
                        <h3 className="text-lg font-semibold">Institution Details</h3>
                        <p className="text-sm text-neutral-600">Tell us about your educational institution</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institution Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="University of Excellence"
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Official Email Address *</FormLabel>
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
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Number *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="REG123456789"
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
                        name="contactInfo.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                {...field}
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        onClick={nextStep}
                        className="w-full h-11"
                        disabled={!form.watch("name") || !form.watch("email") || !form.watch("registrationNumber")}
                      >
                        Continue to Security Setup
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Security & Wallet (UNIFIED) */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                        <h3 className="text-lg font-semibold">Security & Blockchain Setup</h3>
                        <p className="text-sm text-neutral-600">Create a password and connect your wallet</p>
                      </div>

                      {/* Password Section */}
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-800 flex items-start">
                          <Shield className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Your password will be securely stored in your DID document on IPFS - not in our database</span>
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Create Password *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a strong password (min. 8 characters)"
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

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => {
                          const password = form.watch("password");
                          const confirmPassword = field.value;
                          const passwordsMatch = password && confirmPassword && password === confirmPassword;
                          const showMismatch = confirmPassword && password && password !== confirmPassword;

                          return (
                            <FormItem>
                              <FormLabel>Confirm Password *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    {...field}
                                    className={`h-11 pr-10 ${
                                      showMismatch ? 'border-red-500 focus:border-red-500' :
                                      passwordsMatch ? 'border-green-500 focus:border-green-500' : ''
                                    }`}
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
                              {showMismatch && (
                                <p className="text-sm text-red-600 mt-1">Passwords don't match</p>
                              )}
                              {passwordsMatch && (
                                <p className="text-sm text-green-600 mt-1">Passwords match</p>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Wallet Section */}
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 mt-6 mb-4">
                        <p className="text-sm text-purple-800 flex items-start">
                          <Wallet className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Your wallet is required for blockchain registration and certificate issuance</span>
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blockchain Wallet *</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                    {...field}
                                    value={walletAddress || ""}
                                    readOnly
                                    className="h-11 bg-neutral-50"
                                  />
                                  <Button
                                    type="button"
                                    onClick={isConnected ? disconnect : connect}
                                    disabled={walletLoading}
                                    variant={isConnected ? "secondary" : "default"}
                                    className="h-11 px-6 whitespace-nowrap"
                                  >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    {walletLoading ? "Connecting..." : isConnected ? "Disconnect" : "Connect Wallet"}
                                  </Button>
                                </div>
                                {isConnected && (
                                  <div className="flex items-center text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Wallet connected successfully
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {walletError && <FormMessage>{walletError}</FormMessage>}
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-6">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="flex-1 h-11"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                          disabled={
                            isLoading ||
                            !isConnected ||
                            !form.watch("password") ||
                            !form.watch("confirmPassword") ||
                            form.watch("password") !== form.watch("confirmPassword")
                          }
                        >
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isLoading ? "Registering..." : "Complete Registration"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            )}

            {!showOtp && currentStep === 1 && (
              <p className="text-sm text-neutral-600 text-center mt-6">
                Already have an account?{" "}
                <Link href="/login">
                  <button className="text-primary hover:underline font-medium">
                    Sign in here
                  </button>
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
