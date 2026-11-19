import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { API_CONFIG } from "../../config/api";
import { useToast } from "@/hooks/use-toast";

type Step = "initial" | "otp" | "verified" | "exported";

export default function ClaimCredentialPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("initial");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [claimSessionJwt, setClaimSessionJwt] = useState("");
  const [exported, setExported] = useState<{ privateKeyHex: string; address: string } | null>(null);
  const [confirmedWallet, setConfirmedWallet] = useState("");

  const base = `${API_CONFIG.CERT}/api/credentials/claim`;

  const requestOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${base}/${token}/otp`, { method: "POST" });
      if (!res.ok) throw new Error("Could not send verification code");
      setStep("otp");
      toast({ title: "Code sent", description: "Check your email for the 6-digit code." });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${base}/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Invalid code");
      setClaimSessionJwt(data.claimSessionJwt);
      setStep("verified");
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmClaim = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${base}/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${claimSessionJwt}` },
        body: JSON.stringify({ claimMethod: "email-otp" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not confirm claim");
      setConfirmedWallet(data.walletAddress);
      toast({ title: "Credential claimed", description: "Your credential is now linked to your EduCreds identity." });
    } catch (err: any) {
      setError(err.message || "Could not confirm claim");
    } finally {
      setIsLoading(false);
    }
  };

  const exportKey = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${base}/${token}/export-key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${claimSessionJwt}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not export key");
      setExported({ privateKeyHex: data.privateKeyHex, address: data.address });
      setStep("exported");
    } catch (err: any) {
      setError(err.message || "Could not export key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
              EduCreds
            </h1>
          </div>
          <CardTitle className="text-xl">Claim Your Credential</CardTitle>
          <CardDescription>No crypto wallet required. Verify your email to take ownership.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "initial" && (
            <Button className="w-full" onClick={requestOtp} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send me a verification code
            </Button>
          )}

          {step === "otp" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Enter the 6-digit code sent to your email</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl tracking-[0.5em] rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="••••••"
              />
              <Button className="w-full" onClick={verifyOtp} disabled={isLoading || otp.length !== 6}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify code
              </Button>
              <Button variant="ghost" className="w-full" onClick={requestOtp} disabled={isLoading}>
                Resend code
              </Button>
            </div>
          )}

          {step === "verified" && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Email verified. Choose how you want to keep your credential.</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={confirmClaim} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Keep it in my EduCreds account
              </Button>
              <details className="rounded-md border border-neutral-200 p-3">
                <summary className="cursor-pointer text-sm font-medium text-neutral-600">
                  Advanced: export to my own wallet
                </summary>
                <p className="mt-2 text-xs text-amber-600">
                  Only use this if you understand self-custody. The private key below will be shown once and never again.
                </p>
                <Button variant="outline" className="mt-3 w-full" onClick={exportKey} disabled={isLoading}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Export private key to my own wallet
                </Button>
              </details>
            </div>
          )}

          {step === "exported" && exported && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Save this private key now. For your security it will never be shown again.
                </AlertDescription>
              </Alert>
              <div className="rounded-md bg-neutral-900 text-green-300 p-3 text-xs break-all font-mono">
                {exported.privateKeyHex}
              </div>
              <p className="text-xs text-neutral-500 break-all">
                Wallet address: <span className="font-mono">{exported.address}</span>
              </p>
              <p className="text-xs text-amber-600">
                Import this key into a self-custody wallet (e.g. MetaMask or a hardware wallet) only if you want full control. EduCreds can no longer help you recover it.
              </p>
              <Button className="w-full" onClick={confirmClaim} disabled={isLoading}>
                Finish
              </Button>
            </div>
          )}

          {confirmedWallet && (
            <p className="text-xs text-center text-neutral-500 break-all">
              Linked to wallet: <span className="font-mono">{confirmedWallet}</span>
            </p>
          )}

          <div className="text-center pt-2">
            <Link to="/" className="text-sm text-primary hover:underline">
              Back to EduCreds
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
