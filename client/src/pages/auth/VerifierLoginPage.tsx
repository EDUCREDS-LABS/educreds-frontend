import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ShieldCheck, CheckCircle2, Clock, FileSearch, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { DualAuth } from "@/lib/dualAuth";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

const features = [
  { icon: CheckCircle2, label: "Instant blockchain verification" },
  { icon: Clock,        label: "Bulk verification queue" },
  { icon: FileSearch,   label: "Full audit trail per request" },
];

export default function VerifierLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError("");
    try {
      await DualAuth.verifierLogin(data.email, data.password);
      toast({ title: "Signed in", description: "Redirecting to your verification dashboard…" });
      navigate("/verifier/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-[--background] dark:via-[--background] dark:to-[--background]">
      <div className="absolute top-4 left-4">
        <Link to="/access">
          <Button variant="ghost" className="flex items-center gap-2 text-[--muted-foreground]">
            <ArrowLeft className="w-4 h-4" />
            All portals
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-950/20 dark:to-[--background] border-r border-[--border]">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo.svg" alt="EduCreds" className="h-8 w-auto" />
              <h1 className="text-xl font-black tracking-tight text-[--foreground]">EduCreds</h1>
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">Verifier</Badge>
            </div>

            <div className="w-12 h-12 rounded-[14px] bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>

            <h2 className="text-3xl font-black tracking-tighter text-[--foreground] mb-4">
              Verify credentials<br />with confidence
            </h2>
            <p className="text-[--muted-foreground] text-sm leading-relaxed mb-8 max-w-sm">
              Instantly verify academic credentials for candidates and employees — tamper-proof, globally recognized, and blockchain-anchored.
            </p>

            <div className="space-y-4">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-[--foreground]">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-[14px] bg-[--muted] border border-[--border]">
              <p className="text-xs text-[--muted-foreground] leading-relaxed">
                EduCreds verification is accepted by <strong className="text-[--foreground]">500+ institutions</strong> and recognized across 40+ countries.
              </p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md shadow-2xl border-none rounded-[40px] bg-white dark:bg-neutral-900 p-8">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <img src="/logo.svg" alt="EduCreds" className="h-6 w-auto" />
                <span className="text-base font-black text-[--foreground]">EduCreds Verifier</span>
              </div>
              <CardTitle className="text-3xl font-black text-[--foreground] dark:text-white tracking-tighter">
                Verifier Sign In
              </CardTitle>
              <p className="text-[--muted-foreground] text-sm mt-2">
                New organization?{" "}
                <Link to="/verifier/register" className="text-amber-600 dark:text-amber-400 hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="hr@company.com"
                          className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        <Link to="/forgot-password" className="text-xs text-[--muted-foreground] hover:text-primary font-medium">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/20 hover:scale-[1.02] transition-all mt-2"
                    style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In to Verifier Portal"}
                  </Button>
                </form>
              </Form>

              <div className="mt-8 pt-6 border-t border-[--border] text-center">
                <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">
                  Authorized Organizations Only
                </p>
                <div className="flex justify-center gap-6 mt-3">
                  <Link to="/access" className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground] hover:text-[--foreground] transition-colors">
                    All Portals
                  </Link>
                  <Link to="/verify" className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground] hover:text-[--foreground] transition-colors">
                    Quick Verify
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
