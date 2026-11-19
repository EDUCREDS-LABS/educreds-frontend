/**
 * CredentialSharingWizard — Phase 1C
 *
 * 3-step flow: Audience → Attributes → Share
 * - Selective disclosure (checkboxes per attribute)
 * - Expiry + purpose controls
 * - Verification activity feed
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building2,
  GraduationCap,
  Globe,
  Landmark,
  CheckCircle,
  Copy,
  Share2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Eye,
  Bell,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CredentialShareBadge, type CredentialShareBadgeData } from "@/components/sharing/CredentialShareBadge";

// ── Types ──────────────────────────────────────────────────────────────────────

type Audience = "employer" | "university" | "government" | "anyone";
type ExpiryDays = 7 | 14 | 30 | 90;

interface Attribute {
  key: string;
  label: string;
  required: boolean;
}

interface ShareResult {
  // Backend returns shareUrl — url is a fallback alias
  shareUrl?: string;
  url?: string;
  certificateId?: string;
  expiresAt: string;
  audience?: string;
  purpose?: string;
  qrCode?: string;
}

interface VerificationActivity {
  id: string;
  verifierName: string;
  verifiedAt: string;
  purpose: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AUDIENCES: { id: Audience; label: string; icon: typeof Building2; desc: string }[] = [
  { id: "employer",    label: "Employer",    icon: Building2,    desc: "Employment verification" },
  { id: "university",  label: "University",  icon: GraduationCap,desc: "Further study admission" },
  { id: "government",  label: "Government",  icon: Landmark,     desc: "Official verification" },
  { id: "anyone",      label: "Anyone",      icon: Globe,        desc: "Public verification link" },
];

const ALL_ATTRIBUTES: Attribute[] = [
  { key: "name",            label: "Full Name",        required: true  },
  { key: "degree",          label: "Degree / Award",   required: true  },
  { key: "institution",     label: "Institution",      required: true  },
  { key: "graduationDate",  label: "Graduation Date",  required: false },
  { key: "grade",           label: "Grade / Class",    required: false },
  { key: "transcript",      label: "Transcript",       required: false },
];

const PURPOSE_OPTIONS: Record<Audience, string[]> = {
  employer:   ["Employment verification", "Background check", "Skills assessment"],
  university: ["Admission application", "Scholarship application", "Credit transfer"],
  government: ["Visa application", "Official records", "Licensing"],
  anyone:     ["General verification", "Portfolio", "Personal use"],
};

const EXPIRY_OPTIONS: { days: ExpiryDays; label: string }[] = [
  { days: 7,  label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Audience" },
  { n: 2, label: "Details" },
  { n: 3, label: "Share" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={cn(
            "flex items-center justify-center size-8 rounded-full text-xs font-black transition-all",
            current === s.n  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40 scale-110"
            : current > s.n  ? "bg-emerald-500 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
          )}>
            {current > s.n ? <CheckCircle className="size-4" /> : s.n}
          </div>
          <span className={cn(
            "ml-2 text-[10px] font-black uppercase tracking-widest hidden sm:block",
            current >= s.n ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
          )}>{s.label}</span>
          {i < STEPS.length - 1 && (
            <div className={cn(
              "h-0.5 w-8 sm:w-16 mx-3 rounded-full transition-all",
              current > s.n ? "bg-emerald-400" : "bg-neutral-200 dark:bg-neutral-700"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CredentialSharingWizardProps {
  credentialId?: string;
  badge?: Omit<CredentialShareBadgeData, "verificationUrl">;
  onCancel?: () => void;
}

export function CredentialSharingWizard({ credentialId, badge, onCancel }: CredentialSharingWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [audience, setAudience] = useState<Audience>("employer");
  const [selectedAttrs, setSelectedAttrs] = useState<Set<string>>(
    new Set(ALL_ATTRIBUTES.filter((a) => a.required).map((a) => a.key))
  );
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS.employer[0]);
  const [expiry, setExpiry] = useState<ExpiryDays>(30);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifyMe, setNotifyMe] = useState(true);

  // ── Verification activity ────────────────────────────────────────────────
  const { data: activity } = useQuery<VerificationActivity[]>({
    queryKey: ["verification-activity", credentialId],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.CERT}/api/certificates/${credentialId}/verifications`,
          { headers: getAuthHeaders() }
        );
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    },
    enabled: !!credentialId,
    staleTime: 30000,
  });

  // ── Share mutation ───────────────────────────────────────────────────────
  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_CONFIG.CERT}/api/certificates/${credentialId ?? "demo"}/share`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          attributes: Array.from(selectedAttrs),
          purpose,
          expiryDays: expiry,
          notifyOnVerification: notifyMe,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      return await res.json() as ShareResult;
    },
    onSuccess: (data) => {
      setShareResult(data);
      setStep(3);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create share link", description: err.message, variant: "destructive" });
    },
  });

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied", description: "Share this link with the recipient." });
  };

  const toggleAttr = (key: string) => {
    const attr = ALL_ATTRIBUTES.find((a) => a.key === key);
    if (attr?.required) return;
    setSelectedAttrs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleAudienceChange = (a: Audience) => {
    setAudience(a);
    setPurpose(PURPOSE_OPTIONS[a][0]);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Share Credential
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Control exactly what you share and with whom
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-xl">
            <X className="size-4" />
          </Button>
        )}
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Audience ── */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
            Who are you sharing with?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => handleAudienceChange(a.id)}
                  className={cn(
                    "p-5 rounded-2xl border-2 text-left transition-all",
                    audience === a.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-300"
                  )}
                >
                  <Icon className={cn("size-6 mb-3", audience === a.id ? "text-blue-600 dark:text-blue-400" : "text-neutral-400")} />
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{a.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{a.desc}</p>
                </button>
              );
            })}
          </div>
          <Button
            className="w-full rounded-xl font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setStep(2)}
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* ── Step 2: Attributes & Options ── */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Attribute selection */}
          <div>
            <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-3">
              What information to include?
            </p>
            <div className="space-y-2">
              {ALL_ATTRIBUTES.map((attr) => (
                <label
                  key={attr.key}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                    attr.required
                      ? "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 cursor-default"
                      : selectedAttrs.has(attr.key)
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 cursor-pointer"
                        : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 cursor-pointer hover:border-neutral-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedAttrs.has(attr.key)}
                    onChange={() => toggleAttr(attr.key)}
                    disabled={attr.required}
                    className="size-4 rounded accent-blue-600"
                  />
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1">{attr.label}</span>
                  {attr.required && (
                    <Badge className="text-[9px] font-black uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded-full px-2">
                      Required
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-3">Purpose</p>
            <div className="grid grid-cols-1 gap-2">
              {PURPOSE_OPTIONS[audience].map((p) => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left text-sm font-medium transition-all",
                    purpose === p
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div>
            <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-3">Link expires in</p>
            <div className="grid grid-cols-4 gap-2">
              {EXPIRY_OPTIONS.map((e) => (
                <button
                  key={e.days}
                  onClick={() => setExpiry(e.days)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center text-xs font-black uppercase tracking-wide transition-all",
                    expiry === e.days
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 hover:border-neutral-300"
                  )}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notify toggle */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <Bell className="size-5 text-neutral-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Notify me when verified</p>
              <p className="text-xs text-neutral-400">Get an alert when the recipient views this credential</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyMe}
              onClick={() => setNotifyMe((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                notifyMe ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700"
              )}
            >
              <span className={cn("pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform", notifyMe ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              className="flex-1 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              disabled={shareMutation.isPending}
              onClick={() => shareMutation.mutate()}
            >
              {shareMutation.isPending
                ? <><Loader2 className="size-4 animate-spin" />Creating link…</>
                : <><Share2 className="size-4" />Create sharing link</>
              }
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Share link ── */}
      {step === 3 && shareResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Success */}
          <div className="text-center space-y-3 py-4">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
              <CheckCircle className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
              Sharing link created
            </h3>
            <p className="text-sm text-neutral-500">
              Share this link with {AUDIENCES.find((a) => a.id === audience)?.label.toLowerCase() ?? "recipient"}.
              Valid for {expiry} days.
            </p>
          </div>

          {/* Link box */}
          <div className="flex gap-2">
            <div className="flex-1 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs text-neutral-700 dark:text-neutral-300 overflow-hidden break-all">
              {shareResult.shareUrl ?? shareResult.url ?? "Link unavailable"}
            </div>
            <Button
              variant="outline"
              className="rounded-xl shrink-0 gap-2"
              onClick={() => copyLink(shareResult.shareUrl ?? shareResult.url ?? "")}
            >
              {copied ? <CheckCircle className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Personalized badge uses the server-created share URL for its QR code. */}
          {badge && (shareResult.shareUrl ?? shareResult.url) && (
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100">Your shareable credential badge</h4>
                <p className="text-xs text-neutral-500 mt-1">Download the artwork or share the secure link above. The QR code opens this time-limited link.</p>
              </div>
              <CredentialShareBadge data={{ ...badge, verificationUrl: shareResult.shareUrl ?? shareResult.url! }} />
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            {[
              { icon: Globe,    label: "Audience",  value: AUDIENCES.find((a) => a.id === audience)?.label },
              { icon: Eye,      label: "Sharing",   value: `${selectedAttrs.size} of ${ALL_ATTRIBUTES.length} attributes` },
              { icon: Clock,    label: "Expires",   value: `in ${expiry} days` },
              { icon: Building2,label: "Purpose",   value: purpose },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <Icon className="size-4 text-neutral-400 shrink-0" />
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-widest w-20">{row.label}</span>
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{row.value}</span>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl gap-2"
            onClick={() => { setStep(1); setShareResult(null); }}
          >
            Create another sharing link
          </Button>
        </div>
      )}

      {/* ── Verification activity feed ── */}
      {activity && activity.length > 0 && (
        <div className="mt-10 space-y-3">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Recent Verification Activity
          </p>
          {activity.slice(0, 5).map((v) => (
            <div key={v.id} className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
              <div className="size-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{v.verifierName}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {v.purpose}{v.verifiedAt && !isNaN(new Date(v.verifiedAt).getTime()) ? ` · ${format(new Date(v.verifiedAt), "MMM d, yyyy 'at' h:mm a")}` : ''}
                </p>
              </div>
              <ExternalLink className="size-4 text-neutral-300 dark:text-neutral-600 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
