/**
 * Student Settings Page
 * Displays student profile details: name, email, eduCredsId, linked wallet,
 * and the Email Addresses management section (aliases + identity merge).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { getStudentToken } from "@/lib/authStorage";
import { API_CONFIG } from "@/config/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, User, Mail, Wallet, Shield, Copy, Plus, Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CERT_API = API_CONFIG.CERT;

interface StudentProfile {
  walletAddress?: string;
  studentName?: string;
  did?: string;
  eduCredsId?: string;
  credentialsCount?: number;
  email?: string;
}

interface AliasDto {
  id: string;
  email: string;
  isPrimary: boolean;
  verifiedAt: string | null;
  source: string;
  mergedFromIdentityId: string | null;
  createdAt: string;
}

interface MergeWarning {
  existingIdentityId: string;
  existingName: string;
  credentialCount: number;
}

// ── API helpers ──────────────────────────────────────────────────────────────

function authHeaders() {
  const token = getStudentToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function fetchAliases(): Promise<AliasDto[]> {
  const res = await fetch(`${CERT_API}/identity/aliases`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load email addresses");
  return res.json();
}

async function requestOtp(email: string): Promise<{ otpToken: string; message: string; mergeWarning?: MergeWarning }> {
  const res = await fetch(`${CERT_API}/identity/aliases/request-otp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Failed to send verification code");
  }
  return res.json();
}

async function verifyOtp(otpToken: string, otp: string): Promise<{ success: boolean; merged: boolean }> {
  const res = await fetch(`${CERT_API}/identity/aliases/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ otpToken, otp }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || "Verification failed");
  }
  return res.json();
}

async function deleteAlias(aliasId: string): Promise<void> {
  const res = await fetch(`${CERT_API}/identity/aliases/${aliasId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove email address");
}

// ── Add Email Dialog ──────────────────────────────────────────────────────────

type Step = "email" | "otp" | "merge-warning";

interface AddEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AddEmailDialog({ open, onClose, onSuccess }: AddEmailDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [mergeWarning, setMergeWarning] = useState<MergeWarning | null>(null);

  const resetState = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setOtpToken("");
    setMergeWarning(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const sendOtpMutation = useMutation({
    mutationFn: () => requestOtp(email.trim()),
    onSuccess: (data) => {
      setOtpToken(data.otpToken);
      if (data.mergeWarning) {
        setMergeWarning(data.mergeWarning);
        setStep("merge-warning");
      } else {
        setStep("otp");
      }
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp(otpToken, otp.trim()),
    onSuccess: (data) => {
      toast({
        title: data.merged ? "Accounts merged!" : "Email verified!",
        description: data.merged
          ? "The other account's credentials are now visible in your portal."
          : "Your new email address has been added.",
      });
      resetState();
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Verification failed", description: err.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle>Add Email Address</DialogTitle>
              <DialogDescription>
                Link another email to your EduCreds account. We'll send a verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                type="email"
                placeholder="newemail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && email) sendOtpMutation.mutate(); }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={() => sendOtpMutation.mutate()}
                disabled={!email || sendOtpMutation.isPending}
              >
                {sendOtpMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Send Code
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "merge-warning" && mergeWarning && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="size-5" />
                Account Merge Warning
              </DialogTitle>
              <DialogDescription>
                This email belongs to another EduCreds account.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2 text-sm">
              <p><span className="font-medium">Account name:</span> {mergeWarning.existingName}</p>
              <p><span className="font-medium">Credentials in that account:</span> {mergeWarning.credentialCount}</p>
              <p className="text-amber-700 dark:text-amber-300 mt-2">
                Continuing will merge that account into yours. All credentials will be accessible from your portal.
                <strong> This action cannot be undone.</strong>
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => setStep("otp")}
              >
                Continue & Merge
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "otp" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter" && otp.length === 6) verifyMutation.mutate(); }}
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("email")}>Back</Button>
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={otp.length !== 6 || verifyMutation.isPending}
              >
                {verifyMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Verify
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StudentSettingsPage() {
  const { user, isLoading: authLoading, authType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AliasDto | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || authType !== AuthType.STUDENT) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, authType, navigate]);

  const token = getStudentToken();

  const { data: profile, isLoading } = useQuery<StudentProfile>({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const res = await fetch(`${CERT_API}/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!token && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: aliases = [], isLoading: aliasesLoading } = useQuery<AliasDto[]>({
    queryKey: ["student-aliases"],
    queryFn: fetchAliases,
    enabled: !!token && !!user,
    staleTime: 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (aliasId: string) => deleteAlias(aliasId),
    onSuccess: () => {
      toast({ title: "Removed", description: "Email address removed from your account." });
      queryClient.invalidateQueries({ queryKey: ["student-aliases"] });
      setRemoveTarget(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setRemoveTarget(null);
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    });
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="size-5 text-neutral-500" />
          <span className="text-sm text-neutral-500 font-medium">Settings</span>
        </div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Your EduCreds identity and linked wallet details.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Profile Information
          </CardTitle>
          <CardDescription>Your EduCreds student identity details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                <div className="flex items-center gap-3">
                  <User className="size-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-400 font-medium">Name</p>
                    <p className="text-sm font-medium">
                      {profile?.studentName || user?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Email */}
              {(profile?.email || user?.email) && (
                <div className="flex items-start justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">Primary Email</p>
                      <p className="text-sm font-medium">{profile?.email || user?.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                </div>
              )}

              {/* EduCreds ID */}
              {profile?.eduCredsId && (
                <div className="flex items-start justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <Shield className="size-4 text-neutral-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">EduCreds ID</p>
                      <p className="text-sm font-mono font-medium">{profile.eduCredsId}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                </div>
              )}

              {/* Wallet Address */}
              {profile?.walletAddress && (
                <div className="flex items-start justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                  <div className="flex items-center gap-3 min-w-0">
                    <Wallet className="size-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-400 font-medium">Linked Wallet</p>
                      <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 truncate max-w-[280px]">
                        {profile.walletAddress}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(profile.walletAddress!, "Wallet address")}
                    className="shrink-0 p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    title="Copy wallet address"
                  >
                    <Copy className="size-3.5 text-neutral-500" />
                  </button>
                </div>
              )}

              {/* Credentials count */}
              {profile?.credentialsCount !== undefined && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Total Credentials Issued</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {profile.credentialsCount}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Addresses Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4" />
                Email Addresses
              </CardTitle>
              <CardDescription className="mt-1">
                Link additional emails to your account. Credentials issued to any linked email will appear in your portal.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setAddEmailOpen(true)}
            >
              <Plus className="size-3.5 mr-1" />
              Add Email
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aliasesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : aliases.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              No additional emails linked yet.
            </p>
          ) : (
            <div className="space-y-2">
              {aliases.map((alias) => (
                <div
                  key={alias.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="size-4 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{alias.email}</p>
                      <p className="text-xs text-neutral-400">
                        {alias.isPrimary ? "Primary account email" :
                          alias.mergedFromIdentityId ? "Merged account" :
                          alias.verifiedAt ? `Verified ${new Date(alias.verifiedAt).toLocaleDateString()}` :
                          "Pending verification"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {alias.isPrimary ? (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    ) : alias.verifiedAt ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle2 className="size-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        Unverified
                      </Badge>
                    )}
                    {alias.mergedFromIdentityId && (
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                        Merged
                      </Badge>
                    )}
                    {!alias.isPrimary && (
                      <button
                        onClick={() => setRemoveTarget(alias)}
                        className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-red-500"
                        title="Remove email"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Email Dialog */}
      <AddEmailDialog
        open={addEmailOpen}
        onClose={() => setAddEmailOpen(false)}
        onSuccess={() => {
          setAddEmailOpen(false);
          queryClient.invalidateQueries({ queryKey: ["student-aliases"] });
        }}
      />

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove email address?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.mergedFromIdentityId
                ? `This will un-merge the account associated with ${removeTarget?.email}. Credentials from that account will no longer appear in your portal.`
                : `Are you sure you want to remove ${removeTarget?.email} from your account?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              {removeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
