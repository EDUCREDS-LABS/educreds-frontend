import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { API_CONFIG } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.CERT}/auth/institution/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to send reset code.");
      }
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
      toast({
        title: "Reset code sent",
        description: "If an account exists, check your inbox for a reset code.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset code. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Badge
            variant="outline"
            className="mb-4 bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          >
            Account Recovery
          </Badge>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Reset Password
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">
            Enter your email to receive a password reset code.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-neutral-200/60 dark:shadow-black/30 rounded-[32px] dark:bg-neutral-900">
          <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                  >
                    Institutional Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      disabled={isLoading}
                      aria-describedby={error ? "email-error" : undefined}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : null}
                  Send Reset Code
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <ArrowLeft className="inline size-3 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
