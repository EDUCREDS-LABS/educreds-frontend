import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Link as LinkIcon, ArrowRight, XCircle } from "lucide-react";
import { PageMeta } from "@/components/seo/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Public /verify v2 — Sharing-link-only
 *
 * This page ONLY accepts credential sharing links (or the equivalent
 * /verify/<certificateId>?sl=<sharingLinkId> form).
 *
 * No legacy direct verification by certId/tokenId/ipfs is allowed here.
 */
export default function VerifyPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const raw = value.trim();
    if (!raw) return null;

    const tryBuildUrl = (s: string) => {
      try {
        if (s.startsWith("http://") || s.startsWith("https://")) return new URL(s);
        // allow pasting just "/verify/<id>?sl=..."
        if (s.startsWith("/")) return new URL(`https://app.educreds.xyz${s}`);
        // allow pasting "verify/<id>?sl=..."
        if (s.startsWith("verify/")) return new URL(`https://app.educreds.xyz/${s}`);
        return null;
      } catch {
        return null;
      }
    };

    // Case 1: full URL or path
    const u = tryBuildUrl(raw);
    if (u) {
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "verify");
      const certificateId = idx >= 0 ? parts[idx + 1] : undefined;
      const sl = u.searchParams.get("sl");
      const purpose = u.searchParams.get("purpose") ?? undefined;
      const audience = u.searchParams.get("audience") ?? undefined;
      return { certificateId, sl, purpose, audience };
    }

    // Case 2: pasted as "<certificateId>?sl=<id>"
    const m = raw.match(/^([0-9a-fA-F-]{10,})\?(.+)$/);
    if (m) {
      const certificateId = m[1];
      const qs = new URLSearchParams(m[2]);
      const sl = qs.get("sl");
      const purpose = qs.get("purpose") ?? undefined;
      const audience = qs.get("audience") ?? undefined;
      return { certificateId, sl, purpose, audience };
    }

    return null;
  }, [value]);

  const canSubmit = Boolean(parsed?.certificateId && parsed?.sl);

  const onVerify = () => {
    setError(null);
    if (!parsed?.certificateId) {
      setError("Paste a valid EduCreds sharing link (it must include a /verify/<id> path).");
      return;
    }
    if (!parsed?.sl) {
      setError("This looks like a certificate ID, but it is missing the sharing link code (sl=...). Please paste the full share link.");
      return;
    }

    const qp = new URLSearchParams();
    qp.set("sl", parsed.sl);
    if (parsed.purpose) qp.set("purpose", parsed.purpose);
    if (parsed.audience) qp.set("audience", parsed.audience);

    navigate(`/verify/${encodeURIComponent(parsed.certificateId)}?${qp.toString()}`);
  };

  return (
    <>
      <PageMeta
        title="Verify Credential (Share Link)"
        description="Verify an EduCreds credential using a secure sharing link."
        url="/verify"
      />

      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
              <ShieldCheck className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              Verify via Share Link
            </h1>
            <p className="text-sm text-neutral-500">
              This verification page accepts only EduCreds sharing links. The credential owner controls what data you can see.
            </p>
          </div>

          <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-neutral-900">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sharing Link</p>
                <div className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Paste: https://app.educreds.xyz/verify/<certificateId>?sl=<shareId>"
                    className="rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && onVerify()}
                  />
                  <Button
                    className="rounded-xl font-black text-xs uppercase tracking-widest gap-2"
                    onClick={onVerify}
                    disabled={!value.trim()}
                  >
                    <LinkIcon className="size-4" /> Verify
                  </Button>
                </div>
                {parsed && !canSubmit && (
                  <p className="text-xs text-amber-600 font-bold mt-1">
                    Tip: make sure the link contains <span className="font-mono">sl=...</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-2xl border border-red-200 bg-red-50">
                  <XCircle className="size-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Need full verification (EVF, bulk screening, automation)?
                </p>
                <a href="/verifier/verify" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary mt-2">
                  Open Verifier Portal <ArrowRight className="size-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
