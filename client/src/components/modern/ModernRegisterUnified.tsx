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
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { type InsertInstitution } from "@shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { z } from "zod";

const CERT_API_BASE = (API_CONFIG.CERT).replace(/\/$/, "");

// Custom form schema with password fields for registration
const registrationFormSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  contactInfo: z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  plan: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

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

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
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

  const onSubmit = async (data: RegistrationFormData) => {
    if (showOtp) return;
    setIsLoading(true);
    setError("");

    if (!walletAddress) {
      setError("Please connect your wallet - it's required for registration.");
      setIsLoading(false);
      return;
    }

    try {
      setFormData(data);
      setUserEmail(data.email);

      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        registrationNumber: data.registrationNumber,
        contactInfo: data.contactInfo,
        address: data.contactInfo?.address || "Not Provided"
      };

      const otpResponse = await fetch(`${CERT_API_BASE}/auth/institution/register/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
      const verifyResponse = await fetch(`${CERT_API_BASE}/auth/institution/register/step2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp, otpToken })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'OTP verification failed');
      }

      const completeResponse = await fetch(`${CERT_API_BASE}/auth/institution/register/step3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, walletAddress: walletAddress, otpToken })
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await completeResponse.json();
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

      window.dispatchEvent(new CustomEvent('authStateChange'));
      toast({ title: "Registration successful!", description: "Your institution has been registered." });
      setLocation('/institution/dashboard');
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
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
      throw err;
    }
  };

  const nextStep = () => {
    setError("");
    const { name, email, registrationNumber } = form.getValues();
    if (currentStep === 1 && (!name || !email || !registrationNumber)) {
      setError("Please fill in all required fields.");
      return;
    }
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl shadow-2xl border-none rounded-[40px] overflow-hidden">
        <div className="px-10 pt-12 pb-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="EduCreds" className="h-10 w-auto" />
            <span className="text-3xl font-black text-neutral-900 tracking-tighter">EduCreds</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-neutral-900">Institutional Onboarding</h1>
          <p className="text-neutral-500 font-medium">Initialize your cryptographic node identity</p>
        </div>

        <CardContent className="px-10 pb-12 pt-6">
          {showOtp ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Mail className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-black tracking-tight">Verify Your Identity</h3>
                <p className="text-sm font-medium text-neutral-500">Enter the verification code sent to {userEmail}</p>
              </div>
              {error && <Alert variant="destructive" className="rounded-2xl">{error}</Alert>}
              <OtpInput email={userEmail} type="register" onVerify={handleOtpVerify} onResend={handleResendOtp} isLoading={isLoading} otpToken={otpToken} />
              <Button type="button" onClick={() => setShowOtp(false)} variant="ghost" className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-neutral-400" disabled={isLoading}>Back to Form</Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {error && <Alert variant="destructive" className="rounded-2xl">{error}</Alert>}

                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Legal Name</FormLabel>
                        <FormControl><Input placeholder="University of Excellence" {...field} className="h-14 rounded-2xl bg-neutral-100 border-none shadow-inner" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Institutional Email</FormLabel>
                        <FormControl><Input type="email" placeholder="admin@excellence.edu" {...field} className="h-14 rounded-2xl bg-neutral-100 border-none shadow-inner" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Registration ID</FormLabel>
                        <FormControl><Input placeholder="RC-12345" {...field} className="h-14 rounded-2xl bg-neutral-100 border-none shadow-inner" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="button" onClick={nextStep} className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">
                      Continue to Security <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Create Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} {...field} className="h-14 rounded-2xl bg-neutral-100 border-none shadow-inner pr-12" />
                            <Button type="button" variant="ghost" className="absolute right-2 top-2 size-10 rounded-xl" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Confirm Password</FormLabel>
                        <FormControl><Input type={showPassword ? "text" : "password"} {...field} className="h-14 rounded-2xl bg-neutral-100 border-none shadow-inner" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Wallet className="size-5" /></div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-purple-900">Blockchain Identity</p>
                          <p className="text-[10px] font-bold text-purple-600">{isConnected ? 'Connected' : 'Not Connected'}</p>
                        </div>
                      </div>
                      <Button type="button" variant={isConnected ? "secondary" : "default"} className="rounded-xl h-10 px-4" onClick={isConnected ? disconnect : connect}>
                        {isConnected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" onClick={prevStep} variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest text-neutral-400">Back</Button>
                      <Button type="submit" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" disabled={isLoading || !isConnected}>
                        {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Complete Registration"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
