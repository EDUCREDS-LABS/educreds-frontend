import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminAuth } from "@/lib/admin-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, AlertCircle, Shield, Lock, Key, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const adminLoginSchema = z.object({
  email: z.string().email("Valid institutional email is required"),
  password: z.string().min(1, "Access key is required"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await AdminAuth.login(data.email, data.password);
      if (result.success) {
        toast({ title: "Authority Verified", description: "Strategic access granted to portal." });
        setLocation('/admin/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError("Strategic authentication failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Infrastructure */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(21,96,189,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-none shadow-2xl shadow-black/60 bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-indigo-700 p-12 text-center relative">
            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck className="size-32 rotate-12" /></div>
            <div className="size-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/10 shadow-xl">
              <Lock className="size-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black text-white tracking-tighter uppercase">Root Authority</CardTitle>
            <CardDescription className="text-blue-100/70 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">EduCreds Official Administration</CardDescription>
          </div>

          <CardContent className="p-12 pt-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl p-4">
                      <AlertCircle className="size-4" />
                      <AlertDescription className="font-bold text-xs uppercase tracking-widest">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">Institutional Node Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                             <Input
                              {...field}
                              type="email"
                              placeholder="admin@educreds.xyz"
                              className="h-14 bg-white/5 border-white/5 rounded-2xl pl-12 focus:ring-primary/20 transition-all text-white font-medium shadow-inner"
                            />
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-600 group-focus-within:text-primary transition-colors" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400 px-2" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 px-2">Strategic Access Key</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••••••"
                              className="h-14 bg-white/5 border-white/5 rounded-2xl pl-12 focus:ring-primary/20 transition-all text-white shadow-inner"
                            />
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-600 group-focus-within:text-primary transition-colors" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-400 px-2" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-3 size-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-3 size-5" />
                  )}
                  {isLoading ? "Validating Access..." : "Initialize Session"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center mt-10 text-neutral-600 text-[9px] font-black uppercase tracking-[0.4em]">Secure Multi-Chain Administration Layer • Protocol v2.4.0</p>
      </motion.div>
    </div>
  );
}
