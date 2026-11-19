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
import { Loader2, AlertCircle, Code2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { DualAuth } from "@/lib/dualAuth";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  organization: z.string().min(2, "Enter your organization or project name"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function DeveloperRegisterPage() {
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
      await DualAuth.developerRegister({
        name: data.name,
        email: data.email,
        organization: data.organization,
        password: data.password,
      });
      toast({ title: "Account created", description: "Welcome to the EduCreds Developer Platform." });
      navigate("/developer-portal");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-[--background] dark:via-[--background] dark:to-[--background]">
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
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 bg-gradient-to-br from-violet-500/5 to-blue-500/5 dark:from-violet-950/20 dark:to-[--background] border-r border-[--border]">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo.svg" alt="EduCreds" className="h-8 w-auto" />
              <h1 className="text-xl font-black tracking-tight text-[--foreground]">EduCreds</h1>
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">Developer</Badge>
            </div>

            <div className="w-12 h-12 rounded-[14px] bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center mb-6">
              <Code2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>

            <h2 className="text-3xl font-black tracking-tighter text-[--foreground] mb-4">
              Start building<br />in minutes
            </h2>
            <p className="text-[--muted-foreground] text-sm leading-relaxed mb-8 max-w-sm">
              Create your developer account to get your first API key, explore the sandbox, and start issuing verifiable credentials today.
            </p>

            <div className="p-4 rounded-[14px] bg-[--muted] border border-[--border] font-mono text-xs text-[--muted-foreground]">
              <span className="text-violet-600 dark:text-violet-400">POST</span>{" "}
              /v1/credentials/issue<br />
              <span className="text-[--muted-foreground]/60">Authorization: Bearer</span>{" "}
              <span className="text-emerald-600 dark:text-emerald-400">ek_live_…</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md shadow-2xl border-none rounded-[40px] bg-white dark:bg-neutral-900 p-8">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <img src="/logo.svg" alt="EduCreds" className="h-6 w-auto" />
                <span className="text-base font-black text-[--foreground]">EduCreds Developer</span>
              </div>
              <CardTitle className="text-3xl font-black text-[--foreground] dark:text-white tracking-tighter">
                Create Developer Account
              </CardTitle>
              <p className="text-[--muted-foreground] text-sm mt-2">
                Already registered?{" "}
                <Link to="/developer/login" className="text-violet-600 dark:text-violet-400 hover:underline font-semibold">
                  Sign in
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
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jane Smith" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="organization" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization / Project</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Corp or Personal Project" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="you@company.com" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pr-12" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground] transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Repeat your password" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-violet-500/20 hover:scale-[1.02] transition-all mt-2"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Developer Account"}
                  </Button>
                </form>
              </Form>

              <div className="mt-8 pt-6 border-t border-[--border] text-center">
                <div className="flex justify-center gap-6">
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
