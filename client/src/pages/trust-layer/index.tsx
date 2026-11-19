/**
 * Enterprise Trust Layer — Sales Package
 *
 * Five pillars: Security · Privacy · Governance · Operational · Legal
 * Each pillar contains the documents that enterprise buyers, procurement teams,
 * and legal departments ask for before signing. This page is the entry point.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Lock, Vote, Activity, FileText,
  ChevronRight, ExternalLink, Download, CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    id: "security",
    label: "Security",
    icon: Shield,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900",
    description: "Architecture, encryption, access control, and incident response",
    docs: [
      { id: "architecture",      label: "Security Architecture",  path: "/trust-layer/security/architecture" },
      { id: "threat-model",      label: "Threat Model",           path: "/trust-layer/security/threat-model" },
      { id: "encryption",        label: "Encryption Policy",      path: "/trust-layer/security/encryption" },
      { id: "key-management",    label: "Key Management",         path: "/trust-layer/security/key-management" },
      { id: "access-control",    label: "Access Control",         path: "/trust-layer/security/access-control" },
      { id: "rbac",              label: "RBAC",                   path: "/trust-layer/security/rbac" },
      { id: "audit-logging",     label: "Audit Logging",          path: "/trust-layer/security/audit-logging" },
      { id: "incident-response", label: "Incident Response",      path: "/trust-layer/security/incident-response" },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Lock,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-100 dark:border-purple-900",
    description: "GDPR compliance, data handling, consent, and data subject rights",
    docs: [
      { id: "privacy-policy",    label: "Privacy Policy",               path: "/trust-layer/privacy/policy" },
      { id: "dpa",               label: "Data Processing Agreement",     path: "/trust-layer/privacy/dpa" },
      { id: "retention",         label: "Data Retention Policy",        path: "/trust-layer/privacy/retention" },
      { id: "deletion",          label: "Deletion Policy",              path: "/trust-layer/privacy/deletion" },
      { id: "consent",           label: "Consent Model",                path: "/trust-layer/privacy/consent" },
      { id: "dsr",               label: "Data Subject Rights",          path: "/trust-layer/privacy/dsr" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    icon: Vote,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-100 dark:border-amber-900",
    description: "Issuer onboarding, credential lifecycle, disputes, and roles",
    docs: [
      { id: "issuer-onboarding",    label: "Issuer Onboarding",          path: "/trust-layer/governance/issuer-onboarding" },
      { id: "issuer-verification",  label: "Issuer Verification",        path: "/trust-layer/governance/issuer-verification" },
      { id: "revocation",           label: "Credential Revocation",      path: "/trust-layer/governance/revocation" },
      { id: "disputes",             label: "Disputes",                   path: "/trust-layer/governance/disputes" },
      { id: "appeals",              label: "Appeals",                    path: "/trust-layer/governance/appeals" },
      { id: "governance-roles",     label: "Governance Roles",           path: "/trust-layer/governance/roles" },
    ],
  },
  {
    id: "operational",
    label: "Operational",
    icon: Activity,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900",
    description: "SLAs, backup, disaster recovery, and support processes",
    docs: [
      { id: "sla",          label: "Service Level Agreement",   path: "/trust-layer/operational/sla" },
      { id: "backup",       label: "Backup Policy",             path: "/trust-layer/operational/backup" },
      { id: "dr",           label: "Disaster Recovery",         path: "/trust-layer/operational/disaster-recovery" },
      { id: "bcp",          label: "Business Continuity",       path: "/trust-layer/operational/business-continuity" },
      { id: "monitoring",   label: "Uptime Monitoring",         path: "/trust-layer/operational/monitoring" },
      { id: "support",      label: "Support Process",           path: "/trust-layer/operational/support" },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    icon: FileText,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900",
    description: "Terms, institution and verifier agreements, liability boundaries",
    docs: [
      { id: "terms",              label: "Terms of Service",          path: "/trust-layer/legal/terms" },
      { id: "institution-agreement", label: "Institution Agreement", path: "/trust-layer/legal/institution-agreement" },
      { id: "verifier-agreement", label: "Verifier Agreement",       path: "/trust-layer/legal/verifier-agreement" },
      { id: "legal-dpa",          label: "Data Processing Agreement", path: "/trust-layer/legal/dpa" },
      { id: "aup",                label: "Acceptable Use Policy",     path: "/trust-layer/legal/aup" },
      { id: "liability",          label: "Liability Boundaries",      path: "/trust-layer/legal/liability" },
      { id: "ip",                 label: "IP Ownership",              path: "/trust-layer/legal/ip" },
    ],
  },
];

export default function EnterpriseTrustLayer() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalDocs = PILLARS.reduce((s, p) => s + p.docs.length, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <CheckCircle className="size-3" />
            Enterprise Sales Package
          </div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Enterprise Trust Layer
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            {totalDocs} policy and compliance documents across 5 pillars — ready for procurement and legal review
          </p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 shrink-0">
          <Download className="size-4" />
          Download full package
        </Button>
      </div>

      {/* Pillar grid */}
      <div className="grid grid-cols-1 gap-4">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const isOpen = expanded === pillar.id;
          return (
            <Card
              key={pillar.id}
              className={cn(
                "border rounded-3xl overflow-hidden transition-all duration-300",
                isOpen ? pillar.border : "border-neutral-100 dark:border-neutral-800",
                "bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md"
              )}
            >
              {/* Pillar header */}
              <button
                className="w-full text-left"
                onClick={() => setExpanded(isOpen ? null : pillar.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", pillar.bg)}>
                      <Icon className={cn("size-6", pillar.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">{pillar.label}</h2>
                        <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", pillar.bg, pillar.color, pillar.border)}>
                          {pillar.docs.length} docs
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-400 mt-0.5 truncate">{pillar.description}</p>
                    </div>
                    <ChevronRight className={cn("size-5 text-neutral-300 shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
                  </div>
                </CardContent>
              </button>

              {/* Expanded doc list */}
              {isOpen && (
                <div className={cn("border-t px-6 pb-6 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2", pillar.border)}>
                  {pillar.docs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => navigate(doc.path)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left group"
                    >
                      <FileText className="size-4 text-neutral-400 shrink-0" />
                      <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200 flex-1">{doc.label}</span>
                      <ExternalLink className="size-3.5 text-neutral-300 group-hover:text-neutral-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-xs text-neutral-400 text-center pb-4">
        All documents reflect current EduCreds platform policy as of August 2026 · Uganda PDPA 2019 compliant · Draft — legal review in progress
      </p>
    </div>
  );
}
