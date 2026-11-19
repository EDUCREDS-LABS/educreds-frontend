/**
 * Institution White Label — /institution/white-label
 * Configure branding: logo, color, custom domain, email settings.
 */
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Palette, Upload, Globe, Mail, Image as ImageIcon, Save,
  RefreshCw, Eye, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";

interface BrandingConfig {
  logoUrl?: string | null;
  primaryColor?: string;
  emailSenderName?: string;
  customDomain?: string;
  emailFooter?: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: null,
  primaryColor: "#2563eb",
  emailSenderName: "",
  customDomain: "",
  emailFooter: "",
};

export default function WhiteLabelPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Load existing branding ────────────────────────────────────────────────
  const { data, isLoading } = useQuery<BrandingConfig>({
    queryKey: ["institution-branding"],
    queryFn: async () => {
      const res = await fetch(`${API_CONFIG.CERT}/api/institutions/me/branding`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return DEFAULT_BRANDING;
      return res.json();
    },
    staleTime: 120_000,
  });

  useEffect(() => {
    if (data) {
      setForm({ ...DEFAULT_BRANDING, ...data });
      if (data.logoUrl) setLogoPreview(data.logoUrl);
    }
  }, [data]);

  // ── Upload logo ───────────────────────────────────────────────────────────
  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("logo", file); // backend FileInterceptor expects field name 'logo'
      const res = await fetch(`${API_CONFIG.CERT}/api/institutions/profile/logo`, {
        method: "POST",
        headers: getAuthHeaders(), // no Content-Type — let browser set multipart boundary
        body: fd,
      });
      if (!res.ok) throw new Error("Logo upload failed");
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (result) => {
      setForm(prev => ({ ...prev, logoUrl: result.url }));
      setLogoPreview(result.url);
      toast({ title: "Logo uploaded" });
    },
    onError: (err: Error) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    logoMutation.mutate(file);
  };

  // ── Save branding ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (config: BrandingConfig) => {
      const res = await fetch(`${API_CONFIG.CERT}/api/institutions/me/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to save branding");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Branding saved", description: "Your white-label settings have been updated." });
      qc.invalidateQueries({ queryKey: ["institution-branding"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSave = () => saveMutation.mutate(form);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-48 rounded-[24px]" />
      </div>
    );
  }

  const previewBg = form.primaryColor ?? "#2563eb";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="size-4 text-primary" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Institution</p>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">White Label</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how your institution appears to students and verifiers.
          </p>
        </div>
        <Button
          className="rounded-xl h-9 gap-2 shrink-0"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saveMutation.isPending ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Logo */}
          <Card className="rounded-[24px] border">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Institution Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain rounded-xl border bg-muted"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => fileRef.current?.click()}
                    disabled={logoMutation.isPending}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {logoMutation.isPending ? "Uploading…" : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP. Max 2 MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand color */}
          <Card className="rounded-[24px] border">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Palette className="w-4 h-4" /> Brand Color
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={form.primaryColor ?? "#2563eb"}
                  onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-12 h-12 rounded-xl border cursor-pointer"
                />
                <div className="flex-1">
                  <Label className="text-xs font-bold uppercase tracking-widest">Primary Color</Label>
                  <Input
                    value={form.primaryColor ?? "#2563eb"}
                    onChange={e => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#2563eb"
                    className="mt-1.5 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email settings */}
          <Card className="rounded-[24px] border">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest">Sender Name</Label>
                <Input
                  value={form.emailSenderName ?? ""}
                  onChange={e => setForm(prev => ({ ...prev, emailSenderName: e.target.value }))}
                  placeholder="e.g. KBS Credentials"
                  className="rounded-xl text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed as the "From" name on credential emails sent to students.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest">Email Footer Text</Label>
                <Textarea
                  value={form.emailFooter ?? ""}
                  onChange={e => setForm(prev => ({ ...prev, emailFooter: e.target.value }))}
                  placeholder="© 2025 Kampala Business School. All rights reserved."
                  className="rounded-xl text-sm resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom domain */}
          <Card className="rounded-[24px] border">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="w-4 h-4" /> Custom Domain
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Student Credential Domain</Label>
              <Input
                value={form.customDomain ?? ""}
                onChange={e => setForm(prev => ({ ...prev, customDomain: e.target.value }))}
                placeholder="creds.yourinstitution.ac.ug"
                className="rounded-xl font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Students will see this domain when viewing their credentials. Requires a CNAME record pointing to <code className="bg-muted px-1 rounded">creds.educreds.io</code>.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preview</p>
            </div>

            {/* Mock credential card */}
            <div className="rounded-[20px] border bg-white overflow-hidden shadow-sm">
              {/* Header bar */}
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ background: previewBg }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-white/20 p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-white/60" />
                  </div>
                )}
                <div>
                  <p className="text-white font-bold text-sm">
                    {form.emailSenderName || "Your Institution"}
                  </p>
                  <p className="text-white/70 text-xs">Digital Credential</p>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Credential</p>
                  <p className="font-bold text-neutral-800 text-sm">Bachelor of Business Administration</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Issued To</p>
                  <p className="font-semibold text-neutral-700 text-sm">Jane Nakato</p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: previewBg }}
                  />
                  <p className="text-xs font-semibold" style={{ color: previewBg }}>Verified on EduCreds</p>
                </div>
                {form.customDomain && (
                  <p className="text-[10px] text-neutral-400 font-mono">{form.customDomain}/credential/abc123</p>
                )}
              </div>

              {/* Footer */}
              {form.emailFooter && (
                <div className="px-5 pb-4 pt-2 border-t border-neutral-100">
                  <p className="text-[10px] text-neutral-400">{form.emailFooter}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Approximate preview. Final appearance may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
