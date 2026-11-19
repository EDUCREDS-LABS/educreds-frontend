import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { API_CONFIG } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!email || !/^\d{6}$/.test(otp)) {
      setError("Enter your email and the six-digit reset code.");
      return;
    }
    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setError("Passwords must match and be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.CERT}/auth/institution/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "Password reset failed.");
      }
      toast({ title: "Password reset successfully", description: "Sign in with your new password." });
      navigate("/login", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Account Recovery</Badge>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">Set New Password</h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">Enter the code sent to your email. It expires in 5 minutes.</p>
        </div>
        <Card className="border-none shadow-2xl shadow-neutral-200/60 dark:shadow-black/30 rounded-[32px] dark:bg-neutral-900">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert variant="destructive" className="rounded-xl"><AlertDescription>{error}</AlertDescription></Alert>}
              {[
                { id: "email", label: "Institutional Email", value: email, type: "email", readOnly: true },
                { id: "otp", label: "Six-digit Code", value: otp, type: "text", onChange: setOtp },
                { id: "new-password", label: "New Password", value: newPassword, type: "password", onChange: setNewPassword },
                { id: "confirm-password", label: "Confirm Password", value: confirmPassword, type: "password", onChange: setConfirmPassword },
              ].map(({ id, label, value, type, readOnly, onChange }) => (
                <div className="space-y-2" key={id}>
                  <label htmlFor={id} className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{label}</label>
                  <Input id={id} type={type} value={value} readOnly={readOnly} required disabled={loading}
                    onChange={onChange ? e => onChange(id === "otp" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value) : undefined}
                    inputMode={id === "otp" ? "numeric" : undefined} maxLength={id === "otp" ? 6 : undefined}
                    minLength={type === "password" ? 8 : undefined}
                    autoComplete={id === "otp" ? "one-time-code" : id === "new-password" ? "new-password" : undefined}
                    className="h-12 rounded-xl border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                </div>
              ))}
              <Button type="submit" disabled={loading || !email} className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200">
                {loading && <Loader2 className="size-4 animate-spin mr-2" />} Reset Password
              </Button>
              <div className="text-center"><Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700"><ArrowLeft className="inline size-3 mr-1" /> Request another code</Link></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
