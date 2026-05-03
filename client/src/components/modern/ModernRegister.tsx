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
import { API_CONFIG } from '../../config/api';
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
  Phone,
  Globe,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { insertInstitutionSchema, type InsertInstitution } from "@shared/schema";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

const tiers = [
  {
    name: "Free Trial",
    price: "$0",
    features: [
      "14 days access",
      "Up to 15 certificates total",
      "Standard certificate templates",
      "Sandbox environment",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Starter",
    price: "$29/mo",
    features: [
      "Up to 200 certificates/month",
      "Standard certificate templates",
      "Standard API access",
      "Email support",
    ],
    cta: "Choose Starter",
  },
  {
    name: "Pro",
    price: "$99/mo",
    features: [
      "Up to 1,000 certificates/month",
      "Advanced templates & designer",
      "Full API + batch issuance",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited certificates (fair use)",
      "Custom integrations & SSO",
      "Dedicated success team",
      "Enterprise SLAs",
    ],
    cta: "Contact Sales",
  },
];

export default function ModernRegister() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, disconnect, isLoading: walletLoading, error: walletError } = useWallet();

  const [selectedPlan, setSelectedPlan] = useState("Free Trial");
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

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

  // Watch for plan changes
  const watchedPlan = form.watch("plan");

  useEffect(() => {
    if (walletAddress) {
      form.setValue("walletAddress", walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    setSelectedPlan(watchedPlan || "Free");
  }, [watchedPlan]);

  const onSubmit = async (data: InsertInstitution) => {
    if (showOtp) {
      // Handle OTP verification
      return;
    }

    setIsLoading(true);
    setError("");

    // Final validation
    if (!walletAddress) {
      setError("Please connect your wallet before registering.");
      setIsLoading(false);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError("Passwords don't match.");
      setIsLoading(false);
      return;
    }

    try {
      // Check if paid plan and no payment method selected
      if (selectedPlan !== "Free Trial" && !paymentMethod && !showPayment) {
        setShowPayment(true);
        setIsLoading(false);
        return;
      }

      // Handle payment flow for paid plans
      if (selectedPlan !== "Free Trial" && paymentMethod && paymentMethod !== 'later') {
        // TODO: Integrate with actual payment processors
        if (paymentMethod === 'stripe') {
          toast({
            title: "Payment Integration",
            description: "Stripe payment integration coming soon. Starting with Free plan.",
          });
        } else if (paymentMethod === 'paypal') {
          toast({
            title: "Payment Integration",
            description: "PayPal payment integration coming soon. Starting with Free plan.",
          });
        }
        // For now, set to Free plan
        form.setValue('plan', 'Starter');
        setSelectedPlan('Starter');
      }

      // If pay later selected, set plan to Free
      if (paymentMethod === 'later') {
        form.setValue('plan', 'Free Trial');
        setSelectedPlan('Free Trial');
      }

      // Send OTP using correct endpoint
      const otpResponse = await fetch(`${API_CONFIG.CERT}/auth/institution/send-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      if (!otpResponse.ok) {
        throw new Error('Failed to send OTP. Please check your email address.');
      }

      const { otpToken } = await otpResponse.json();
      setOtpToken(otpToken);
      setUserEmail(data.email);
      setShowOtp(true);

      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
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
      const { confirmPassword, ...registrationData } = formData;
      const payload = {
        ...registrationData,
        role: "institution",
        walletAddress,
        otp,
        otpToken: token
      };

      const response = await api.register(payload);

      // Store authentication data properly with MongoDB ID
      localStorage.setItem('institution_token', response.token);
      localStorage.setItem('auth_type', 'institution');
      if (response.institution) {
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
        title: "Registration successful!",
        description: "Your institution has been registered. Welcome to EduCreds!",
      });

      setLocation('/institution/dashboard');
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const response = await fetch(`${API_CONFIG.CERT}/auth/institution/send-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });

    if (!response.ok) throw new Error('Failed to resend OTP');

    const { otpToken } = await response.json();
    setOtpToken(otpToken);
    return { otpToken };
  };

  const nextStep = () => {
    setError("");

    // Validate current step before proceeding
    if (currentStep === 1) {
      const { name, email, registrationNumber } = form.getValues();
      if (!name || !email || !registrationNumber) {
        setError("Please fill in all required fields.");
        return;
      }
    }

    if (currentStep === 2 && !selectedPlan) {
      setError("Please select a plan to continue.");
      return;
    }

    if (currentStep === 3) {
      const { password, confirmPassword } = form.getValues();
      if (!password || !confirmPassword) {
        setError("Please fill in both password fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
      if (!walletAddress) {
        setError("Please connect your wallet before proceeding.");
        return;
      }
    }

    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getStepProgress = () => (currentStep / 4) * 100;

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
              Join EduCreds to start issuing blockchain certificates
            </p>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-neutral-600 mb-2">
                <span>Step {currentStep} of 4</span>
                <span>{Math.round(getStepProgress())}% Complete</span>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-4 mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= currentStep
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-500'
                    }`}>
                    {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-0.5 mx-2 ${step < currentStep ? 'bg-primary' : 'bg-neutral-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Step 1: Basic Information */}
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
                          <FormLabel>Institution Name</FormLabel>
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
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Official Email Address</FormLabel>
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

                    <Button
                      type="button"
                      onClick={nextStep}
                      className="w-full h-11"
                      disabled={!form.watch("name") || !form.watch("email") || !form.watch("registrationNumber")}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Plan Selection */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">Choose Your Plan</h3>
                      <p className="text-sm text-neutral-600">Select a plan that fits your institution's needs</p>
                      {selectedPlan && (
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Selected: {selectedPlan}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto px-4">
                      {tiers.map((tier) => (
                        <Card
                          key={tier.name}
                          className={`flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md relative min-h-[280px] ${selectedPlan === tier.name
                              ? "border-2 border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20 scale-105"
                              : "border border-gray-200 hover:border-primary/50"
                            } ${tier.name === "Professional" ? "ring-2 ring-orange-400 border-orange-400" : ""}`}
                          onClick={() => {
                            setSelectedPlan(tier.name);
                            form.setValue("plan", tier.name);
                            setError(""); // Clear any previous errors
                          }}
                        >
                          {tier.name === "Professional" && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 text-xs font-semibold shadow-lg">
                                Most Popular
                              </Badge>
                            </div>
                          )}
                          {selectedPlan === tier.name && (
                            <div className="absolute -top-3 -right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <CardHeader className="pb-4 px-6">
                            <CardTitle className="text-lg flex items-center justify-between mb-2">
                              {tier.name}
                            </CardTitle>
                            <CardDescription className="text-3xl font-bold text-primary leading-tight">
                              {tier.price}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="px-6 pb-6 flex-grow">
                            <ul className="space-y-3">
                              {tier.features.map((feature) => (
                                <li key={feature} className="flex items-start text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-11">
                        Back
                      </Button>
                      <Button type="button" onClick={nextStep} className="flex-1 h-11">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}


                {/* Step 3: Security & Wallet */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">Security Setup</h3>
                      <p className="text-sm text-neutral-600">Secure your account and connect your wallet</p>
                    </div>

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
                                placeholder="Create a strong password"
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
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  {...field}
                                  className={`h-11 pr-10 ${showMismatch ? 'border-red-500 focus:border-red-500' :
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

                    <FormField
                      control={form.control}
                      name="walletAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blockchain Wallet</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Connect your wallet to continue"
                                  {...field}
                                  value={walletAddress || ""}
                                  readOnly
                                  className="h-11"
                                />
                                <Button
                                  type="button"
                                  onClick={isConnected ? disconnect : connect}
                                  disabled={walletLoading}
                                  variant={isConnected ? "secondary" : "default"}
                                  className="h-11 px-6"
                                >
                                  <Wallet className="w-4 h-4 mr-2" />
                                  {walletLoading ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
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

                    <div className="flex gap-3">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-11">
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 h-11"
                        disabled={!isConnected || !form.watch("password") || !form.watch("confirmPassword")}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Contact Information & Payment */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    {showOtp ? (
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <Mail className="w-12 h-12 text-primary mx-auto mb-2" />
                          <h3 className="text-lg font-semibold">Verify Your Email</h3>
                          <p className="text-sm text-neutral-600">Enter the code sent to {userEmail}</p>
                        </div>

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
                          onClick={() => setShowOtp(false)}
                          variant="outline"
                          className="w-full h-11"
                        >
                          Back to Form
                        </Button>
                      </div>
                    ) : showPayment ? (
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <Wallet className="w-12 h-12 text-primary mx-auto mb-2" />
                          <h3 className="text-lg font-semibold">Payment Method</h3>
                          <p className="text-sm text-neutral-600">Choose how you'd like to pay for {selectedPlan} plan</p>
                        </div>

                        <div className="space-y-3">
                          <div
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'
                              }`}
                            onClick={() => setPaymentMethod('stripe')}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={paymentMethod === 'stripe'}
                                onChange={() => setPaymentMethod('stripe')}
                                className="text-primary"
                              />
                              <div>
                                <h4 className="font-medium">Credit/Debit Card</h4>
                                <p className="text-sm text-neutral-600">Pay securely with Stripe</p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'
                              }`}
                            onClick={() => setPaymentMethod('paypal')}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={paymentMethod === 'paypal'}
                                onChange={() => setPaymentMethod('paypal')}
                                className="text-primary"
                              />
                              <div>
                                <h4 className="font-medium">PayPal</h4>
                                <p className="text-sm text-neutral-600">Pay with your PayPal account</p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'later' ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'
                              }`}
                            onClick={() => setPaymentMethod('later')}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={paymentMethod === 'later'}
                                onChange={() => setPaymentMethod('later')}
                                className="text-primary"
                              />
                              <div>
                                <h4 className="font-medium">Pay Later</h4>
                                <p className="text-sm text-neutral-600">Start with Free plan, upgrade anytime</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={() => setShowPayment(false)}
                            variant="outline"
                            className="flex-1 h-11"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 h-11"
                            disabled={!paymentMethod || isLoading}
                          >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {paymentMethod === 'later' ? 'Continue with Free Plan' :
                              paymentMethod === 'stripe' ? 'Continue (Payment Coming Soon)' :
                                paymentMethod === 'paypal' ? 'Continue (Payment Coming Soon)' : 'Continue'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <Mail className="w-12 h-12 text-primary mx-auto mb-2" />
                          <h3 className="text-lg font-semibold">Contact Information</h3>
                          <p className="text-sm text-neutral-600">Optional details to complete your profile</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="contactInfo.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                      placeholder="+1 (555) 123-4567"
                                      {...field}
                                      className="h-11 pl-10"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contactInfo.website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                      placeholder="https://university.edu"
                                      {...field}
                                      className="h-11 pl-10"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="contactInfo.address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                                  <Input
                                    placeholder="123 University Ave, City, State 12345"
                                    {...field}
                                    className="h-11 pl-10"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            After registration, you'll need to submit verification documents before you can issue certificates.
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                          <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-11">
                            Back
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                            disabled={isLoading}
                          >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedPlan === 'Free' ? 'Create Account' : 'Continue to Payment'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{" "}
                <Link href="/login">
                  <button className="text-primary hover:underline font-medium">
                    Sign in here
                  </button>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}