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
import { Loader2, AlertCircle, Landmark, Lock, BarChart3, Network, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { DualAuth } from "@/lib/dualAuth";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Enter a valid official email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accessCode: z.string().min(6, "Enter the access code issued to your ministry"),
});
type FormData = z.infer<typeof schema>;

const features = [
  { icon: Network,   label: "National institution trust graph" },
  { icon: BarChart3, label: "Issuance & verification analytics" },
  { icon: Shield,    label: "Accreditation oversight dashboard" },
];

export default function GovernmentLoginPage() {
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
      await DualAuth.governmentLogin(data.email, data.password, data.accessCode);
      toast({ title: "Access granted", description: "Redirecting to the national oversight dashboard…" });
      navigate("/government/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Verify your credentials and access code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-[--background] dark:via-[--background] dark:to-[--background]">
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
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 bg-gradient-to-br from-slate-500/5 to-red-500/5 dark:from-slate-950/30 dark:to-[--background] border-r border-[--border]">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo.svg" alt="EduCreds" className="h-8 w-auto" />
              <h1 className="text-xl font-black tracking-tight text-[--foreground]">EduCreds</h1>
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30">
                Government
              </Badge>
            </div>

            <div className="w-12 h-12 rounded-[14px] bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mb-6">
              <Landmark className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-3xl font-black tracking-tighter text-[--foreground] mb-4">
              National Credential<br />Oversight Portal
            </h2>
            <p className="text-[--muted-foreground] text-sm leading-relaxed mb-8 max-w-sm">
              Monitor institutional compliance, accreditation status, and credential integrity across the national education network.
            </p>

            <div className="space-y-4">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-[--foreground]">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-[14px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800/30 flex items-start gap-3">
              <Lock className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                This portal is restricted to authorized government ministries and regulatory authorities. An access code is required.
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
                <span className="text-base font-black text-[--foreground]">EduCreds Government</span>
              </div>

              {/* Restricted badge */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  Restricted Access — Authorized Ministries Only
                </div>
              </div>

              <CardTitle className="text-3xl font-black text-[--foreground] dark:text-white tracking-tighter">
                Government Sign In
              </CardTitle>
              <p className="text-[--muted-foreground] text-sm mt-2">
                Access code required. Contact{" "}
                <a href="mailto:government@educreds.xyz" className="text-primary hover:underline font-semibold">
                  government@educreds.xyz
                </a>
                {" "}to request one.
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
                      <FormLabel>Official Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="official@ministry.gov"
                          className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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

                  <FormField control={form.control} name="accessCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ministry Access Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="GOV-XXXX-XXXX"
                          className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner font-mono tracking-widest uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <p className="text-xs text-[--muted-foreground] mt-1.5">
                        Access codes are issued to authorized ministries only.{" "}
                        <a href="mailto:government@educreds.xyz" className="text-primary hover:underline">
                          Request access →
                        </a>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all mt-2 bg-secondary hover:bg-secondary/90 text-white"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Access Government Portal"}
                  </Button>
                </form>
              </Form>

              <div className="mt-8 pt-6 border-t border-[--border] text-center">
                <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">
                  Government & Regulatory Access Only
                </p>
                <div className="flex justify-center gap-6 mt-3">
                  <Link to="/access" className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground] hover:text-[--foreground] transition-colors">
                    All Portals
                  </Link>
                  <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground] hover:text-[--foreground] transition-colors">
                    Institution Login
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
