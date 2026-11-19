import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_CONFIG } from '../../config/api';
import OtpInput from "@/components/ui/otp-input";
import { Loader2, Mail, Wallet, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { z } from "zod";
import { getInstitutionTierDestination } from "@/lib/deploymentTier";
import { setAuthItem } from "@/lib/authStorage";

const CERT_API_BASE = (API_CONFIG.CERT).replace(/\/$/, "");

type DeploymentTier = 'workspace' | 'cloud-connector' | 'enterprise-connector';

// Updated form schema
const registrationFormSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  walletAddress: z.string().optional(),
  registrationNumber: z.string().min(1, "Registration number is required"),
  deploymentTier: z.enum(['workspace', 'cloud-connector', 'enterprise-connector']),
  connectorApiUrl: z.string().optional(),
  connectorEndpoint: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

export default function ModernRegisterUnified() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const { isConnected, walletAddress, connect, disconnect } = useWallet();

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
      deploymentTier: 'workspace',
      connectorApiUrl: '',
      connectorEndpoint: '',
    },
  });

  const deploymentTier = form.watch('deploymentTier');

  // Effect to sync wallet address
  useEffect(() => {
    if (walletAddress) {
      form.setValue("walletAddress", walletAddress);
    }
  }, [walletAddress, form]);

  // Effect to read 'tier' from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tierParam = searchParams.get('tier');
    if (tierParam && ['workspace', 'cloud-connector', 'enterprise-connector'].includes(tierParam as DeploymentTier)) {
      form.setValue('deploymentTier', tierParam as DeploymentTier);
    }
  }, [location.search, form]);

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

  const onSubmit = async (data: RegistrationFormData) => {
    if (showOtp) return;
    setIsLoading(true);
    setError("");

    try {
      setFormData(data);
      setUserEmail(data.email);

      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        registrationNumber: data.registrationNumber,
        address: "Not Provided" // Legacy field
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
      toast({ title: "OTP Sent", description: "Check your email for the verification code." });
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
        body: JSON.stringify({ email: formData.email, otp, otpToken: token })
      });
      if (!verifyResponse.ok) throw new Error((await verifyResponse.json()).message || 'OTP verification failed');
      
      const step3Payload = {
        email: formData.email,
        walletAddress: walletAddress,
        otpToken: token,
        deploymentTier: formData.deploymentTier,
        ...(formData.deploymentTier === 'cloud-connector' && formData.connectorApiUrl
          ? { connectorApiUrl: formData.connectorApiUrl }
          : {}),
        ...(formData.deploymentTier === 'enterprise-connector' && formData.connectorEndpoint
          ? { connectorEndpoint: formData.connectorEndpoint }
          : {}),
      };

      const completeResponse = await fetch(`${CERT_API_BASE}/auth/institution/register/step3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step3Payload)
      });
      if (!completeResponse.ok) throw new Error((await completeResponse.json()).message || 'Registration failed');

      const result = await completeResponse.json();
      setAuthItem('institution_token', result.token);
      setAuthItem('auth_type', 'institution');
      if (formData.deploymentTier !== 'workspace') {
        sessionStorage.setItem('integration_setup_pending', formData.deploymentTier);
      }
      if (result.institution) {
        const institutionUser = {
          ...result.institution,
          type: 'institution',
          deploymentTier: result.institution.deploymentTier ?? formData.deploymentTier ?? 'workspace',
          connectorApiUrl: result.institution.connectorApiUrl ?? formData.connectorApiUrl,
          connectorEndpoint: result.institution.connectorEndpoint ?? formData.connectorEndpoint,
        };
        setAuthItem('institution_user', JSON.stringify(institutionUser));
        navigate(getInstitutionTierDestination(institutionUser.deploymentTier), { replace: true });
      } else {
        navigate(getInstitutionTierDestination(formData.deploymentTier), { replace: true });
      }

      window.dispatchEvent(new CustomEvent('authStateChange'));
      toast({ title: "Registration successful!", description: "Your institution has been registered." });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... (other handlers like handleResendOtp, nextStep, prevStep remain the same)

  const handleResendOtp = async (): Promise<{ otpToken: string }> => {
    try {
      const payload = {
        name: formData.name,
        email: userEmail,
        password: formData.password,
        registrationNumber: formData.registrationNumber,
        address: "Not Provided",
      };

      const otpResponse = await fetch(`${CERT_API_BASE}/auth/institution/register/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json();
        throw new Error(errorData.message || 'Failed to resend OTP');
      }

      const { otpToken: newToken } = await otpResponse.json();
      setOtpToken(newToken);
      toast({ title: "OTP Sent", description: "New verification code sent to your email." });
      return { otpToken: newToken };
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
      throw err;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F7F6F2]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 0%, rgba(56,98,168,0.12) 0%, transparent 55%), linear-gradient(180deg, #060B14 0%, #060B14 28%, #F7F6F2 28%)",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12 sm:px-8">
        <a
          href="https://educreds.xyz"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
        >
          ← educreds.xyz
        </a>

        <div className="border border-[#E6E2DA] bg-white p-8 sm:p-10">
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="EduCreds" className="h-7 w-auto" />
            <span className="text-[15px] font-bold text-[#0B1220]">EduCreds</span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
            Step {currentStep} of 2
          </p>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-[#0B1220]">
            Register your institution
          </h1>
          <p className="text-[14px] text-[#6B7382]">
            Create your account to start issuing verifiable credentials.
          </p>
        </div>

        <div>
          {showOtp ? (
            <OtpInput
              email={userEmail}
              type="register"
              onVerify={handleOtpVerify}
              onResend={handleResendOtp}
              isLoading={isLoading}
              otpToken={otpToken}
            />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {error && <Alert variant="destructive" className="rounded-2xl">{error}</Alert>}

                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Legal Name</FormLabel>
                        <FormControl><Input placeholder="University of Excellence" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                       <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Institutional Email</FormLabel>
                        <FormControl><Input type="email" placeholder="admin@excellence.edu" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Registration ID</FormLabel>
                        <FormControl><Input placeholder="RC-12345" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* *** NEW TIER SELECTION UI *** */}
                    <FormField control={form.control} name="deploymentTier" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Deployment Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-none border-[#E6E2DA] bg-transparent"><SelectValue placeholder="Select a deployment tier" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="workspace">EduCreds Workspace (Managed)</SelectItem>
                            <SelectItem value="cloud-connector">Cloud Connector (API)</SelectItem>
                            <SelectItem value="enterprise-connector">Enterprise Connector (On-prem)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {deploymentTier === 'cloud-connector' && (
                      <FormField control={form.control} name="connectorApiUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Connector API URL (Optional)</FormLabel>
                          <FormControl><Input type="url" placeholder="https://your.sis.com/api" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent" /></FormControl>
                          <FormMessage />
                          <p className="text-[11px] text-neutral-500 font-medium">You can configure this after registration from your dashboard.</p>
                        </FormItem>
                      )} />
                    )}
                    {deploymentTier === 'enterprise-connector' && (
                      <FormField control={form.control} name="connectorEndpoint" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Connector API URL (Optional)</FormLabel>
                          <FormControl><Input type="url" placeholder="https://your.onprem.connector" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent" /></FormControl>
                          <FormMessage />
                          <p className="text-[11px] text-neutral-500 font-medium">You can configure this after registration from your dashboard.</p>
                        </FormItem>
                      )} />
                    )}
                    
                    <Button type="button" onClick={nextStep} className="h-12 w-full rounded-none bg-[#0B1220] text-[13px] font-semibold text-white hover:bg-[#162033]">Continue to security <ArrowRight className="ml-2 size-4" /></Button>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent pr-12" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Repeat password" {...field} className="h-12 rounded-none border-[#E6E2DA] bg-transparent pr-12" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Wallet (Optional)</p>
                      {isConnected && walletAddress ? (
                        <div className="flex h-12 items-center justify-between border border-[#E6E2DA] px-4">
                          <div className="flex items-center gap-3">
                            <Wallet className="size-4 text-[#C9A84C]" />
                            <span className="text-sm font-mono font-medium">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={disconnect}>Disconnect</Button>
                        </div>
                      ) : (
                        <Button type="button" variant="outline" onClick={connect} className="h-12 w-full rounded-none border-[#E6E2DA] text-[13px] font-semibold">
                          <Wallet className="mr-2 size-4" /> Connect wallet
                        </Button>
                      )}
                      <p className="text-[12px] leading-relaxed text-[#6B7382]">
                        Skip wallet connection and EduCreds creates a secure embedded DID wallet for your institution.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button type="button" variant="ghost" onClick={prevStep} className="text-[13px] font-semibold">Back</Button>
                      <Button type="button" onClick={() => form.handleSubmit(onSubmit)()} className="h-12 rounded-none bg-[#0B1220] px-6 text-[13px] font-semibold text-white hover:bg-[#162033]">
                        Complete registration <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          )}
        </div>
        </div>
        <p className="mt-6 text-center text-[13px] text-[#6B7382]">
          Already registered?{" "}
          <a href="/login" className="font-semibold text-[#0B1220] hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
