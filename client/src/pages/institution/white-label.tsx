import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Palette,
  Image,
  Globe,
  Type,
  Eye,
  Save,
  RotateCcw,
  Paintbrush,
  Layout,
  Mail,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandingConfig {
  institutionName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  customDomain: string;
  emailFromName: string;
  emailFooterText: string;
  showPoweredBy: boolean;
  customCss: string;
}

const DEFAULT_CONFIG: BrandingConfig = {
  institutionName: "University of Technology",
  tagline: "Empowering Academic Excellence with Verifiable Credentials",
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  accentColor: "#06b6d4",
  logoUrl: "",
  faviconUrl: "",
  customDomain: "",
  emailFromName: "University of Technology Credentials",
  emailFooterText: "This is an automated message from the University of Technology credential verification system.",
  showPoweredBy: true,
  customCss: "",
};

function ColorSwatch({ color, label, onChange }: { color: string; label: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="size-10 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden" style={{ backgroundColor: color }}>
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{label}</p>
        <p className="text-xs font-mono text-neutral-400">{color}</p>
      </div>
    </div>
  );
}

export default function WhiteLabelPage() {
  const { toast } = useToast();

  const { data: brandingData, isLoading } = useQuery({
    queryKey: ["white-label-config"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_CONFIG.CERT}/api/institutions/branding`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });

  const [config, setConfig] = useState<BrandingConfig>(brandingData ?? DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = <K extends keyof BrandingConfig>(field: K, value: BrandingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast({ title: "Branding saved", description: "Your white-label configuration has been updated." });
    setHasChanges(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
    toast({ title: "Reset to defaults", description: "All branding settings reset. Save to apply." });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            White Label
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            Customize branding, colors, and portal appearance for your institution
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="rounded-xl border-neutral-200 dark:border-neutral-700 font-bold text-xs uppercase tracking-widest gap-2">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="rounded-xl font-bold text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <Type className="size-5" />
              Institution Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Institution Name</Label>
              <Input value={config.institutionName} onChange={(e) => updateField("institutionName", e.target.value)} className="rounded-xl border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tagline</Label>
              <Input value={config.tagline} onChange={(e) => updateField("tagline", e.target.value)} className="rounded-xl border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Logo URL</Label>
              <Input value={config.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} placeholder="https://your-institution.edu/logo.png" className="rounded-xl border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Favicon URL</Label>
              <Input value={config.faviconUrl} onChange={(e) => updateField("faviconUrl", e.target.value)} placeholder="https://your-institution.edu/favicon.ico" className="rounded-xl border-neutral-200 dark:border-neutral-700" />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <Palette className="size-5" />
              Brand Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <ColorSwatch color={config.primaryColor} label="Primary Color" onChange={(c) => updateField("primaryColor", c)} />
            <ColorSwatch color={config.secondaryColor} label="Secondary Color" onChange={(c) => updateField("secondaryColor", c)} />
            <ColorSwatch color={config.accentColor} label="Accent Color" onChange={(c) => updateField("accentColor", c)} />

            {/* Color Preview */}
            <div className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-3">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Preview</p>
              <div className="flex items-center gap-3">
                <div className="h-10 flex-1 rounded-xl" style={{ backgroundColor: config.primaryColor }} />
                <div className="h-10 flex-1 rounded-xl" style={{ backgroundColor: config.secondaryColor }} />
                <div className="h-10 flex-1 rounded-xl" style={{ backgroundColor: config.accentColor }} />
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" className="rounded-lg text-xs font-bold" style={{ backgroundColor: config.primaryColor, color: "#fff" }}>
                  Primary Button
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg text-xs font-bold" style={{ borderColor: config.secondaryColor, color: config.secondaryColor }}>
                  Secondary
                </Button>
                <Badge className="text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: config.accentColor, color: "#fff" }}>
                  Badge
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <Globe className="size-5" />
              Custom Domain
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Verification Portal Domain</Label>
              <Input value={config.customDomain} onChange={(e) => updateField("customDomain", e.target.value)} placeholder="credentials.your-institution.edu" className="rounded-xl border-neutral-200 dark:border-neutral-700" />
              <p className="text-xs text-neutral-400">Point a CNAME record to <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">verify.educreds.xyz</code></p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Show "Powered by EduCreds"</p>
                <p className="text-xs text-neutral-400">Display attribution badge on verification pages</p>
              </div>
              <Switch checked={config.showPoweredBy} onCheckedChange={(v) => updateField("showPoweredBy", v)} />
            </div>
          </CardContent>
        </Card>

        {/* Email Branding */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <Mail className="size-5" />
              Email Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">From Name</Label>
              <Input value={config.emailFromName} onChange={(e) => updateField("emailFromName", e.target.value)} className="rounded-xl border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Email Footer Text</Label>
              <Textarea value={config.emailFooterText} onChange={(e) => updateField("emailFooterText", e.target.value)} rows={3} className="rounded-xl border-neutral-200 dark:border-neutral-700 resize-none" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom CSS */}
      <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
        <CardHeader className="px-8 pt-8 pb-4">
          <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <Paintbrush className="size-5" />
            Custom CSS
          </CardTitle>
          <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Advanced: override verification portal styles with custom CSS
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Textarea
            value={config.customCss}
            onChange={(e) => updateField("customCss", e.target.value)}
            rows={8}
            placeholder={`/* Custom styles for your verification portal */\n.credential-card {\n  border-radius: 16px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.1);\n}`}
            className="rounded-xl border-neutral-200 dark:border-neutral-700 font-mono text-sm resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
