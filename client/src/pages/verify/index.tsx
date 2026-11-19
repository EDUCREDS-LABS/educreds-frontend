/**
 * Public Verification Hub — /verify
 *
 * Single unified entry point for ALL verification users:
 * - Anonymous (public free tier) — limited per IP
 * - Free registered — slightly higher limits
 * - Paid verifier — full EVF + AI pipeline
 *
 * Conversion: shows rate meter, locked EVF/AI features, upgrade CTA.
 */
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { VerificationCenter } from "@/components/verification/VerificationCenter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Zap, Lock, ArrowRight, CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ── Rate limit display ─────────────────────────────────────────────────────────

// ── Paid plan feature row ──────────────────────────────────────────────────────

function FeatureRow({ label, free, starter, pro }: { label: string; free: string; starter: string; pro: string }) {
  return (
    <div className="grid grid-cols-4 gap-2 py-3 border-b border-[--border] last:border-0 text-sm">
      <span className="text-[--foreground] font-medium col-span-1">{label}</span>
      <span className="text-[--muted-foreground] text-center text-xs">{free}</span>
      <span className="text-primary text-center text-xs font-bold">{starter}</span>
      <span className="text-indigo-600 dark:text-indigo-400 text-center text-xs font-bold">{pro}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function VerifyHubPage() {
  const { isAuthenticated, authType } = useAuth();
  const navigate = useNavigate();
  const isVerifier = isAuthenticated && authType === "verifier";
  const isInstitution = isAuthenticated && authType === "institution";

  // If logged-in verifier, go straight to their portal
  useEffect(() => {
    if (isVerifier) navigate("/verifier/verify", { replace: true });
  }, [isVerifier, navigate]);

  return (
    <div className="min-h-screen bg-[--background]">
      {/* Header */}
      <header className="border-b border-[--border] bg-[--background] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-black text-sm text-[--foreground] tracking-tight">EduCreds Verify</span>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <>
                <Link to="/verifier/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-[--muted-foreground] text-xs">Sign In</Button>
                </Link>
                <Link to="/verifier/register">
                  <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest">Get Free Account</Button>
                </Link>
              </>
            )}
            {isAuthenticated && !isVerifier && (
              <Link to="/verifier/login">
                <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest gap-1.5">
                  Verifier Portal <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main verification panel */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
                Public Verification
              </Badge>
              <h1 className="text-2xl font-black text-[--foreground] tracking-tighter mb-2">Verify a Credential</h1>
              <p className="text-sm text-[--muted-foreground]">
                Enter a credential ID, scan a QR code, or upload a document to verify its authenticity.
              </p>
            </div>

            {/* Verification widget */}
            <VerificationCenter />

            {/* Locked features teaser */}
            {!isVerifier && (
              <Card className="rounded-[24px] border-2 border-dashed border-[--border] bg-[--muted]/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-[--foreground]">EVF + AI Verification</p>
                      <p className="text-xs text-[--muted-foreground]">Automated, bulk, and AI-validated results</p>
                    </div>
                    <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest">
                      Paid Feature
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {[
                      "Bulk CSV verification",
                      "AI confidence scoring",
                      "Instant API access",
                      "Webhook callbacks",
                      "Analytics dashboard",
                      "Audit trail export",
                    ].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                        <Lock className="w-3 h-3 text-[--muted-foreground]/40 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to="/verifier/register">
                      <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                        Get Free Account <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link to="/verifier/login">
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-[--muted-foreground]">
                        Sign in
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Usage counts are intentionally omitted until a live quota endpoint is available. */}
            <Card className="rounded-[24px] border border-[--border] bg-[--card]">
              <CardContent className="p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground] mb-4">
                  Verification Usage
                </p>
                <p className="text-sm text-[--muted-foreground]" role="status">
                  Usage and limits are currently unavailable. Verification requests may still be subject to rate limits.
                </p>

                {!isAuthenticated && (
                  <div className="pt-2 text-center">
                    <p className="text-xs text-[--muted-foreground] mb-3">
                      Create a free account for 100 EVF verifications/month
                    </p>
                    <Link to="/verifier/register">
                      <Button size="sm" className="w-full rounded-xl font-black text-xs uppercase tracking-widest">
                        Create Free Account
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paid tier comparison */}
            <Card className="rounded-[24px] border border-[--border] bg-[--card]">
              <CardContent className="p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground] mb-4">Plans</p>

                <div className="grid grid-cols-4 gap-2 pb-2 border-b border-[--border] mb-1">
                  <span className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest col-span-1"></span>
                  <span className="text-[10px] font-black text-[--muted-foreground] text-center uppercase tracking-wider">Free</span>
                  <span className="text-[10px] font-black text-primary text-center uppercase tracking-wider">Starter</span>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 text-center uppercase tracking-wider">Pro</span>
                </div>

                {[
                  { label: "Public checks",  free: "2/day", starter: "Unlimited", pro: "Unlimited"   },
                  { label: "EVF checks",     free: "1/day", starter: "500/mo",    pro: "5,000/mo"    },
                  { label: "EVF + AI",       free: "—",     starter: "50/mo",     pro: "1,000/mo"    },
                  { label: "Bulk CSV",       free: "—",     starter: "✓",         pro: "✓"           },
                  { label: "API access",     free: "—",     starter: "✓",         pro: "✓"           },
                  { label: "Analytics",      free: "—",     starter: "Basic",     pro: "Advanced"    },
                  { label: "Audit export",   free: "—",     starter: "—",         pro: "✓"           },
                  { label: "Price",          free: "$0",    starter: "$49/mo",    pro: "$199/mo"     },
                ].map(r => <FeatureRow key={r.label} {...r} />)}

                <div className="mt-4">
                  <Link to="/verifier/register">
                    <Button size="sm" className="w-full rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                      Start Free <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
