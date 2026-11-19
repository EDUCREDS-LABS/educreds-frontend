/**
 * CredentialDetailSheet — 5-tab credential record viewer
 *
 * Tabs: Overview · Proof · Verification · History · Sharing
 * Used in both institution credential list and student portal.
 * No blockchain IDs in the primary view — technical details in Proof tab only.
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle, XCircle, Award, ShieldCheck, Shield, History, Share2,
  Download, AlertTriangle, Loader2, ExternalLink, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CredentialSharingWizard } from "@/components/sharing/CredentialSharingWizard";
import { format } from "date-fns";
import {
  VerificationCredentialFields,
  VerificationLayersSection,
  VerificationStatusBanner,
  hasVerificationLayers,
} from "@/components/verification/VerificationStack";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Credential {
  id: string;
  studentName?: string;
  courseName?: string;
  grade?: string;
  institutionName?: string;
  issuedAt?: string;
  certificateType?: string;
  issuanceStatus?: string;
  isMinted?: boolean;
  ipfsHash?: string;
  imageUrl?: string;
  previewImageUrl?: string;
  tokenId?: number;
  [key: string]: any;
}

interface CredentialDetailSheetProps {
  credential: Credential | null;
  open: boolean;
  onClose: () => void;
  canRevoke?: boolean;
}

type Tab = "overview" | "proof" | "verification" | "history" | "sharing";

// ── Helpers ────────────────────────────────────────────────────────────────────

function status(c: Credential): "valid" | "pending" | "revoked" {
  if (c.issuanceStatus === "revoked" || (c as any).isValid === false) return "revoked";
  if (!c.isMinted && c.issuanceStatus !== "completed") return "pending";
  return "valid";
}

const STATUS_CFG = {
  valid:   { label: "Verified", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  pending: { label: "Pending",  icon: Shield,      color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/40"   },
  revoked: { label: "Revoked",  icon: XCircle,     color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/40"       },
};

// ── Tab: Overview ──────────────────────────────────────────────────────────────

function OverviewTab({ c }: { c: Credential }) {
  return (
    <div className="space-y-6">
      <VerificationStatusBanner result={c as any} />

      {/* Visual preview */}
      {(badgePreview || c.previewImageUrl || c.imageUrl) && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-700 dark:text-neutral-200">Credential badge</p>
              <p className="text-xs text-neutral-500 mt-1">Institution artwork · consistent with the issue preview</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">Preview</Badge>
          </div>
          <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-xl bg-white shadow-sm">
            <img
              src={badgePreview || c.previewImageUrl || c.imageUrl}
              alt={`${c.courseName || "Credential"} badge artwork`}
              className="block h-auto w-full object-contain"
            />
          </div>
        </div>
      )}

      <VerificationCredentialFields result={c as any} />

      {c.certificateType && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Credential Type</p>
          <p className="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100">{c.certificateType}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Proof ─────────────────────────────────────────────────────────────────

function ProofTab({ c }: { c: Credential }) {
  const { toast } = useToast();
  const hasLayers = hasVerificationLayers(c as any);
  const st = status(c);
  const checks: Array<{ label: string; pass: boolean; fail?: boolean }> = [
    { label: "Recorded and signed by your institution", pass: true },
    { label: c.isMinted ? "Anchored on-chain" : "On-chain anchoring pending", pass: !!c.isMinted },
    { label: st === "revoked" ? "Revoked by your institution" : "Not revoked", pass: st !== "revoked", fail: st === "revoked" },
  ];

  return (
    <div className="space-y-6">
      {hasLayers ? (
        <VerificationLayersSection result={c as any} />
      ) : (
        <div>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Record status</p>
          <p className="text-xs text-neutral-500 mb-3">From your institution&apos;s records. Open the verification page to run the full independent check.</p>
          <div className="space-y-2">
            {checks.map((ch) => (
              <div key={ch.label} className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                {ch.fail
                  ? <XCircle className="size-4 text-red-500 shrink-0" />
                  : ch.pass
                    ? <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                }
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{ch.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical details — collapsed by default */}
      {(c.ipfsHash || c.tokenId) && (
        <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Technical Details</p>
          {c.ipfsHash && (
            <div>
              <p className="text-[10px] font-bold text-neutral-400 mb-1">Credential Integrity Hash</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 truncate flex-1">{c.ipfsHash}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(c.ipfsHash!); toast({ title: "Copied" }); }}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Copy className="size-3 text-neutral-400" />
                </button>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${c.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <ExternalLink className="size-3 text-neutral-400" />
                </a>
              </div>
            </div>
          )}
          {c.tokenId != null && (
            <div>
              <p className="text-[10px] font-bold text-neutral-400 mb-1">Blockchain Record ID</p>
              <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">#{c.tokenId}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Verification ──────────────────────────────────────────────────────────

function VerificationTab({ c }: { c: Credential }) {
  const verifyUrl = `${window.location.origin}/verify/${c.id}`;
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Public Verification Link</p>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
        <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 flex-1 truncate">{verifyUrl}</p>
        <button
          onClick={() => { navigator.clipboard.writeText(verifyUrl); toast({ title: "Copied" }); }}
          className="shrink-0 p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          <Copy className="size-3.5 text-neutral-400" />
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        Anyone with this link can verify this credential's authenticity without needing an EduCreds account.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-2"
        onClick={() => window.open(verifyUrl, "_blank")}
      >
        <ExternalLink className="size-3.5" /> Open verification page
      </Button>
    </div>
  );
}

// ── Tab: History ───────────────────────────────────────────────────────────────

function HistoryTab({ c }: { c: Credential }) {
  const events = [
    c.issuedAt && { label: "Credential issued", date: c.issuedAt, icon: CheckCircle, color: "text-emerald-500" },
    c.issuanceStatus === "revoked" && { label: "Credential revoked", date: c.revokedAt ?? c.updatedAt, icon: XCircle, color: "text-red-500" },
  ].filter(Boolean) as { label: string; date: string; icon: typeof CheckCircle; color: string }[];

  if (events.length === 0) {
    return <p className="text-sm text-neutral-400 py-4">No history available.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((ev, i) => {
        const Icon = ev.icon;
        return (
          <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800">
            <Icon className={cn("size-5 shrink-0 mt-0.5", ev.color)} />
            <div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{ev.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {ev.date ? format(new Date(ev.date), "MMMM d, yyyy 'at' h:mm a") : "—"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CredentialDetailSheet({ credential, open, onClose, canRevoke = false }: CredentialDetailSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  useEffect(() => {
    if (!open || !credential) {
      setBadgePreview(null);
      return;
    }
    let cancelled = false;
    const issueYear = credential.issuedAt
      ? String(new Date(credential.issuedAt).getFullYear())
      : String(new Date().getFullYear());
    api.getBadgePreview({
      institutionName: credential.institutionName || "Issuing institution",
      credentialType: credential.certificateType || credential.courseName || "Academic Credential",
      issueYear,
    }).then((preview) => {
      if (!cancelled) setBadgePreview(preview);
    }).catch(() => {
      // Keep the stored image as a graceful fallback if preview generation is unavailable.
      if (!cancelled) setBadgePreview(null);
    });
    return () => { cancelled = true; };
  }, [open, credential?.id, credential?.institutionName, credential?.certificateType, credential?.courseName, credential?.issuedAt]);

  const TABS: { id: Tab; label: string; icon: typeof CheckCircle }[] = [
    { id: "overview",     label: "Overview",     icon: Award      },
    { id: "proof",        label: "Proof",        icon: Shield     },
    { id: "verification", label: "Verification", icon: ShieldCheck },
    { id: "history",      label: "History",      icon: History    },
    { id: "sharing",      label: "Sharing",      icon: Share2     },
  ];

  const revokeMutation = useMutation({
    mutationFn: () => api.revokeCertificate(credential!.id, { reasonCode: 0, reasonText: "Revoked", detailsUri: "" }),
    onSuccess: () => {
      toast({ title: "Credential revoked", description: "The credential has been revoked successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      setShowRevokeConfirm(false);
      onClose();
    },
    onError: (e: Error) => toast({ title: "Revocation failed", description: e.message, variant: "destructive" }),
  });

  const downloadCert = () => {
    if (!credential) return;
    const link = credential.ipfsHash
      ? `https://gateway.pinata.cloud/ipfs/${credential.ipfsHash}`
      : credential.imageUrl ?? credential.previewImageUrl;
    if (link) window.open(link, "_blank");
  };

  if (!credential) return null;
  const st = status(credential);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0" side="right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 p-6">
          <SheetHeader>
            <SheetTitle className="text-xl font-black text-neutral-900 dark:text-neutral-100 leading-tight">
              {credential.courseName ?? "Credential"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-0", STATUS_CFG[st].bg, STATUS_CFG[st].color)}>
              {STATUS_CFG[st].label}
            </Badge>
            <span className="text-xs text-neutral-400">{credential.institutionName ?? "—"}</span>
            <a href={`/institution/credentials/${credential.id}`} className="ml-auto text-xs font-semibold text-primary hover:underline" data-testid="sheet-open-full-record">Open full record</a>
          </div>
        </div>

        {/* Tab nav */}
        <div className="border-b border-neutral-100 dark:border-neutral-800 px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 py-3 px-3 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all",
                    tab === t.id
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  )}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "overview"     && <OverviewTab      c={credential} />}
          {tab === "proof"        && <ProofTab         c={credential} />}
          {tab === "verification" && <VerificationTab  c={credential} />}
          {tab === "history"      && <HistoryTab       c={credential} />}
          {tab === "sharing"      && (
            <CredentialSharingWizard
              credentialId={credential.id}
              onCancel={() => setTab("overview")}
            />
          )}
        </div>

        {/* Actions footer */}
        {tab !== "sharing" && (
          <div className="sticky bottom-0 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 p-4 flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl gap-2 flex-1"
              onClick={downloadCert}
              disabled={!credential.ipfsHash && !credential.imageUrl && !credential.previewImageUrl}
            >
              <Download className="size-4" /> Download
            </Button>
            <Button
              className="rounded-xl gap-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setTab("sharing")}
              disabled={st !== "valid"}
            >
              <Share2 className="size-4" /> Share
            </Button>
            {canRevoke && st === "valid" && (
              <Button
                variant="outline"
                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => setShowRevokeConfirm(true)}
              >
                Revoke
              </Button>
            )}
          </div>
        )}

        {/* Revoke confirm */}
        {showRevokeConfirm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-6 z-20">
            <div className="w-full max-w-sm space-y-4">
              <Alert className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="size-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  <p className="font-bold">Revoke this credential?</p>
                  <p className="text-sm mt-1">This is permanent. The student will be notified and the credential will be marked as revoked in all future verification checks.</p>
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowRevokeConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2"
                  disabled={revokeMutation.isPending}
                  onClick={() => revokeMutation.mutate()}
                >
                  {revokeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Revoke permanently
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
