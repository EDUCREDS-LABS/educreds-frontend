import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ExternalLink, Link2, QrCode, Code2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ShareCredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verificationUrl: string;
  credentialTitle?: string;
  badgeImageUrl?: string;
}

/** Escape attribute values in the copyable HTML snippet. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function ShareCredentialModal({
  open, onOpenChange, verificationUrl, credentialTitle, badgeImageUrl,
}: ShareCredentialModalProps) {
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);
  const [copyError, setCopyError] = useState(false);
  const title = credentialTitle || "Credential";
  const validUrl = (() => {
    try {
      const parsed = new URL(verificationUrl);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  })();
  const embedCode = validUrl
    ? `<a href="${escapeHtml(verificationUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Verify ${escapeHtml(title)}">${badgeImageUrl ? `<img src="${escapeHtml(badgeImageUrl)}" alt="${escapeHtml(title)} verification badge" />` : `Verify ${escapeHtml(title)}`}</a>`
    : "";

  async function copy(value: string, kind: "link" | "embed") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setCopyError(false);
      window.setTimeout(() => setCopied((current) => current === kind ? null : current), 2000);
    } catch {
      setCopyError(true);
      setCopied(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) { setCopied(null); setCopyError(false); }
      onOpenChange(next);
    }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="pr-6">
          <DialogTitle>Share credential</DialogTitle>
          <DialogDescription>Share a link to verify {title}. Anyone with the link can view its verification page.</DialogDescription>
        </DialogHeader>
        {!validUrl ? (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            A verification link is not available for this credential yet.
          </p>
        ) : (
          <Tabs defaultValue="link" className="min-w-0">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-5">
              <TabsTrigger value="link" className="gap-1.5 px-2"><Link2 className="size-4" aria-hidden="true" /> Link</TabsTrigger>
              <TabsTrigger value="qr" className="gap-1.5 px-2"><QrCode className="size-4" aria-hidden="true" /> QR code</TabsTrigger>
              <TabsTrigger value="linkedin" className="px-2">LinkedIn</TabsTrigger>
              <TabsTrigger value="email" className="gap-1 px-2"><Mail className="size-4" aria-hidden="true" /> Email</TabsTrigger>
              <TabsTrigger value="embed" className="gap-1.5 px-2"><Code2 className="size-4" aria-hidden="true" /> Embed</TabsTrigger>
            </TabsList>
            <TabsContent value="link" className="space-y-3 pt-3">
              <label htmlFor="credential-verification-url" className="text-sm font-medium">Verification link</label>
              <div className="flex min-w-0 gap-2">
                <input id="credential-verification-url" readOnly value={verificationUrl} onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <Button type="button" onClick={() => void copy(verificationUrl, "link")} aria-label="Copy verification link">
                  {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}<span className="ml-2 hidden sm:inline">{copied === "link" ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                Preview verification page <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </TabsContent>
            <TabsContent value="qr" className="flex flex-col items-center gap-4 pt-4 text-center">
              <div className="rounded-xl border bg-white p-4" role="img" aria-label={`QR code for verification of ${title}`}>
                <QRCodeSVG value={verificationUrl} size={192} marginSize={0} />
              </div>
              <p className="text-sm text-muted-foreground">Scan to open the verification page.</p>
            </TabsContent>
            <TabsContent value="linkedin" className="space-y-3 pt-3"><p className="text-sm text-muted-foreground">LinkedIn will generate its preview from the verification page. Badge imagery requires the page’s Open Graph image metadata.</p><Button asChild><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`} target="_blank" rel="noopener noreferrer">Share to LinkedIn <ExternalLink className="ml-2 size-4" /></a></Button></TabsContent>
            <TabsContent value="email" className="space-y-3 pt-3"><p className="text-sm text-muted-foreground">Open your email app with a verification link ready to send.</p><Button asChild><a href={`mailto:?subject=${encodeURIComponent(`Verify my ${title} credential`)}&body=${encodeURIComponent(`You can verify my credential here: ${verificationUrl}`)}`}>Send via email <Mail className="ml-2 size-4" /></a></Button></TabsContent>
            <TabsContent value="embed" className="space-y-3 pt-3">
              <label htmlFor="credential-embed-code" className="text-sm font-medium">HTML badge snippet</label>
              <textarea id="credential-embed-code" readOnly value={embedCode} rows={4} onFocus={(event) => event.currentTarget.select()}
                className="w-full resize-none rounded-md border bg-background p-3 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <Button type="button" variant="outline" onClick={() => void copy(embedCode, "embed")}>
                {copied === "embed" ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
                {copied === "embed" ? "Copied" : "Copy HTML"}
              </Button>
              <p className="text-xs text-muted-foreground">Paste this snippet into a website to link to the verification page.</p>
            </TabsContent>
          </Tabs>
        )}
        {copyError && <p role="alert" className="text-sm text-destructive">Could not copy automatically. Select and copy the text instead.</p>}
        <span role="status" className="sr-only">{copied ? `${copied === "link" ? "Link" : "HTML"} copied to clipboard` : ""}</span>
      </DialogContent>
    </Dialog>
  );
}
