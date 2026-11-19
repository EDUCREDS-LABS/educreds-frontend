/**
 * CredentialWallet — Student Portal
 *
 * Beautiful credential cards with real data from the student's EDU-ID session.
 * Navigation: My Credentials → My Identity → Share → Verification Activity
 * No blockchain terminology, no wallet addresses, no token IDs visible by default.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award, User, Share2, Eye, GraduationCap, Building2,
  Calendar, CheckCircle, XCircle, Clock, Download,
  Shield, ShieldCheck, Star, Search, Grid3x3, List, ChevronRight,
  ExternalLink, AlertTriangle, Lock, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { TrustTierBadge } from "@/components/trust/TrustTierBadge";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { CredentialSharingWizard } from "@/components/sharing/CredentialSharingWizard";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "credentials" | "identity" | "activity";

interface Cert {
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
  htmlContent?: string;
  tokenId?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function certStatus(cert: Cert): "valid" | "pending" | "revoked" {
  if (cert.issuanceStatus === "revoked") return "revoked";
  if (!cert.isMinted && cert.issuanceStatus !== "completed") return "pending";
  return "valid";
}

const STATUS_CONFIG = {
  valid:   { label: "Verified",  icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  pending: { label: "Pending",   icon: Clock,        color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40"  },
  revoked: { label: "Revoked",   icon: XCircle,      color: "text-red-600 dark:text-red-400",        bg: "bg-red-50 dark:bg-red-950/40"      },
};

// ── Credential card ────────────────────────────────────────────────────────────

function CredCard({
  cert, view, onShare,
}: { cert: Cert; view: "grid" | "list"; onShare: (cert: Cert) => void }) {
  const status = certStatus(cert);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const issuedDate = cert.issuedAt ? format(new Date(cert.issuedAt), "MMM d, yyyy") : "—";

  const downloadCert = () => {
    const link = cert.ipfsHash
      ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsHash}`
      : cert.imageUrl ?? cert.previewImageUrl;
    if (link) window.open(link, "_blank");
  };

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-md transition-all group">
        <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
          <Award className="size-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{cert.courseName ?? "—"}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{cert.institutionName ?? "—"} · {issuedDate}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-0", cfg.bg, cfg.color)}>
            {cfg.label}
          </Badge>
          {status === "valid" && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onShare(cert)}
            >
              <Share2 className="size-3" /> Share
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
      {/* Visual header */}
      <div className="relative h-32 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 overflow-hidden">
        {(cert.previewImageUrl || cert.imageUrl) ? (
          <img
            src={cert.previewImageUrl ?? cert.imageUrl}
            alt={cert.courseName}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Award className="size-20 text-white" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border-0 shadow", cfg.bg, cfg.color)}>
            <StatusIcon className="size-2.5 mr-1" />
            {cfg.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-black text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2">
            {cert.courseName ?? "Credential"}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
            <Building2 className="size-3" />
            {cert.institutionName ?? "—"}
          </p>
          {(cert as any).institutionTrustTier || (cert as any).institutionTrustScore ? (
            <div className="mt-1">
              <TrustTierBadge
                tier={(cert as any).institutionTrustTier}
                score={(cert as any).institutionTrustScore}
                size="sm"
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {cert.grade && (
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <p className="text-neutral-400 font-bold uppercase tracking-widest text-[9px]">Grade</p>
              <p className="font-black text-neutral-800 dark:text-neutral-200 mt-0.5">{cert.grade}</p>
            </div>
          )}
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-[9px]">Issued</p>
            <p className="font-black text-neutral-800 dark:text-neutral-200 mt-0.5">{issuedDate}</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {status === "valid" && (
            <Button
              className="flex-1 rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
              onClick={() => onShare(cert)}
            >
              <Share2 className="size-3.5" /> Share
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5"
            onClick={downloadCert}
            disabled={!cert.ipfsHash && !cert.imageUrl && !cert.previewImageUrl}
          >
            <Download className="size-3.5" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Identity tab ───────────────────────────────────────────────────────────────

function IdentityTab({ user }: { user: any }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const studentUser = user as any;

  return (
    <div className="space-y-6 max-w-xl">
      {/* Identity status */}
      <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckCircle className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                {studentUser?.name ?? studentUser?.email ?? "Student"}
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="size-3" /> Verified Identity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Identity",     value: "Active",       color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Credentials",  value: "—",            color: "text-neutral-900 dark:text-neutral-100" },
              { label: "Wallet",       value: "Connected",    color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Recovery",     value: "Protected",    color: "text-emerald-600 dark:text-emerald-400" },
            ].map((row) => (
              <div key={row.label} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{row.label}</p>
                <p className={cn("text-sm font-black mt-0.5", row.color)}>{row.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy controls */}
      <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="size-5 text-neutral-400" />
            <p className="font-bold text-neutral-900 dark:text-neutral-100">Privacy Controls</p>
          </div>
          {[
            { label: "Public profile",            sub: "Allow anyone to view your credentials",            on: false },
            { label: "Verification notifications", sub: "Notify me when someone verifies my credential",  on: true  },
            { label: "Analytics sharing",          sub: "Help improve EduCreds with anonymised usage data", on: false },
          ].map((ctrl) => (
            <div key={ctrl.label} className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
              <div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{ctrl.label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{ctrl.sub}</p>
              </div>
              <div className={cn("size-10 rounded-full flex items-center justify-center", ctrl.on ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700")}>
                <div className={cn("size-4 rounded-full bg-white transition-transform", ctrl.on ? "translate-x-1.5" : "-translate-x-1.5")} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* DID — always visible when available */}
      {(studentUser?.eduCredsId || studentUser?.walletAddress) && (
        <Card className="rounded-[28px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-blue-500" />
              <p className="font-bold text-neutral-900 dark:text-neutral-100">Decentralised Identity (DID)</p>
            </div>
            {studentUser?.eduCredsId && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">EduCreds ID</p>
                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                  did:educreds:student:{studentUser.eduCredsId}
                </p>
              </div>
            )}
            {studentUser?.walletAddress && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Wallet Address</p>
                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                  {studentUser.walletAddress}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced toggle for raw details */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-bold transition-colors"
      >
        <ChevronRight className={cn("size-4 transition-transform", showAdvanced && "rotate-90")} />
        Advanced identity details
      </button>

      {showAdvanced && (
        <Card className="rounded-[28px] border-none bg-neutral-50 dark:bg-neutral-900">
          <CardContent className="p-5 space-y-3">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Full DID Document</p>
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
              {studentUser?.eduCredsId
                ? `did:educreds:student:${studentUser.eduCredsId}`
                : studentUser?.walletAddress ?? "Not available"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Activity tab ───────────────────────────────────────────────────────────────

function ActivityTab({ certs }: { certs: Cert[] }) {
  // Use verification history from cert data if available, otherwise show placeholder
  const hasActivity = certs.some((c) => (c as any).verificationHistory?.length > 0);

  if (!hasActivity) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
          <Eye className="size-8 text-neutral-300 dark:text-neutral-600" />
        </div>
        <p className="font-bold text-neutral-500">No verification activity yet</p>
        <p className="text-sm text-neutral-400">When someone verifies one of your credentials, it will appear here.</p>
      </div>
    );
  }

  const activities = certs.flatMap((cert) =>
    ((cert as any).verificationHistory ?? []).map((v: any) => ({
      ...v,
      credentialName: cert.courseName,
    }))
  ).sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500 font-medium mb-4">Who accessed your credentials</p>
      {activities.slice(0, 20).map((a, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
          <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
            <Building2 className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-neutral-900 dark:text-neutral-100">{a.verifierName ?? "Anonymous"}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {a.credentialName} · {a.purpose ?? "Verification"}
            </p>
          </div>
          <p className="text-xs text-neutral-400 shrink-0">
            {a.verifiedAt ? format(new Date(a.verifiedAt), "MMM d, h:mm a") : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CredentialWallet() {
  const { user, authType } = useAuth();
  const [tab, setTab] = useState<Tab>("credentials");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [sharingCert, setSharingCert] = useState<Cert | null>(null);

  const studentUser = user as any;
  const isStudentSession = authType === AuthType.STUDENT && !!studentUser?.eduCredsId;

  const { data: certsData, isLoading } = useQuery({
    queryKey: ["student-credentials", studentUser?.eduCredsId],
    queryFn: async () => {
      try {
        if (studentUser?.eduCredsId) {
          const r = await api.getCertificatesByEduId(studentUser.eduCredsId);
          return Array.isArray(r) ? r : (r?.certificates ?? []);
        }
        if (studentUser?.email) {
          const r = await api.getCertificatesByEmail(studentUser.email);
          return Array.isArray(r) ? r : (r?.certificates ?? []);
        }
        return [];
      } catch { return []; }
    },
    enabled: isStudentSession || !!studentUser?.email,
    staleTime: 30_000,
  });

  const certs: Cert[] = certsData ?? [];

  const filtered = useMemo(() =>
    certs.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.courseName?.toLowerCase().includes(q) ||
        c.institutionName?.toLowerCase().includes(q) ||
        c.grade?.toLowerCase().includes(q)
      );
    }),
    [certs, search]
  );

  const tabs: { id: Tab; label: string; icon: typeof Award }[] = [
    { id: "credentials", label: "My Credentials",        icon: Award     },
    { id: "identity",    label: "My Identity",           icon: User      },
    { id: "activity",    label: "Verification Activity", icon: Eye       },
  ];

  // Sharing overlay
  if (sharingCert) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <CredentialSharingWizard
          credentialId={sharingCert.id}
          badge={{
            institutionName: sharingCert.institutionName ?? "Issuing institution",
            studentName: sharingCert.studentName ?? studentUser?.name ?? "Credential holder",
            credentialTitle: sharingCert.courseName ?? "Academic Credential",
            issuedAt: sharingCert.issuedAt,
            credentialId: sharingCert.id,
            isMinted: sharingCert.isMinted,
          }}
          onCancel={() => setSharingCert(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {studentUser?.name ?? studentUser?.email ?? "My Credentials"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1.5">
            <CheckCircle className="size-3 text-emerald-500" />
            Verified student identity
          </p>
        </div>
        <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-0 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full self-start sm:self-center">
          {certs.length} credential{certs.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Tab nav */}
      <div className="flex rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 flex-1 min-w-max py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                tab === t.id
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ")[1] ?? t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Credentials tab */}
      {tab === "credentials" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search + view toggle */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search credentials…"
                className="pl-9 rounded-xl border-neutral-200 dark:border-neutral-700"
              />
            </div>
            <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn("px-3 py-2 transition-colors", view === "grid" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900" : "bg-white dark:bg-neutral-900 text-neutral-400 hover:text-neutral-700")}
              >
                <Grid3x3 className="size-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("px-3 py-2 transition-colors", view === "list" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900" : "bg-white dark:bg-neutral-900 text-neutral-400 hover:text-neutral-700")}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className={cn("gap-4", view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3")}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className={cn("rounded-[28px]", view === "grid" ? "h-64" : "h-16")} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                <Award className="size-8 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="font-bold text-neutral-500">
                {search ? "No credentials match your search" : "No credentials yet"}
              </p>
              <p className="text-sm text-neutral-400">
                {search ? "Try a different search term" : "Your credentials will appear here once your institution issues them"}
              </p>
            </div>
          )}

          {/* Cards */}
          {!isLoading && filtered.length > 0 && (
            <div className={cn(
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            )}>
              {filtered.map((cert) => (
                <CredCard
                  key={cert.id}
                  cert={cert}
                  view={view}
                  onShare={setSharingCert}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Identity tab */}
      {tab === "identity" && <IdentityTab user={user} />}

      {/* Activity tab */}
      {tab === "activity" && <ActivityTab certs={certs} />}
    </div>
  );
}
