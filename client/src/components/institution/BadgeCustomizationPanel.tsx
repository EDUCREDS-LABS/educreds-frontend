import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Award, Briefcase, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface CredentialBranding {
  badgeAccentColor?: string | null;
  badgeLogoUrl?: string | null;
  badgeTagline?: string | null;
  badgeDefaultVariant?: string;
  pdfLayout?: string;
  pdfSignatureUrl?: string | null;
}

const variants = [
  { value: 'academic', label: 'Academic', icon: GraduationCap, description: 'Degrees and diplomas' },
  { value: 'professional', label: 'Professional', icon: Briefcase, description: 'Professional credentials' },
  { value: 'certification', label: 'Certification', icon: ShieldCheck, description: 'Industry certifications' },
  { value: 'award', label: 'Award', icon: Award, description: 'Honors and distinctions' },
];

export function BadgeCustomizationPanel({ branding, institutionName, onSaved }: { branding: CredentialBranding; institutionName: string; onSaved?: (value: CredentialBranding) => void }) {
  const [accentColor, setAccentColor] = useState(branding.badgeAccentColor || '#1A56DB');
  const [logoUrl, setLogoUrl] = useState(branding.badgeLogoUrl || '');
  const [tagline, setTagline] = useState(branding.badgeTagline || '');
  const [variant, setVariant] = useState(branding.badgeDefaultVariant || 'academic');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [retry, setRetry] = useState(0);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    setAccentColor(branding.badgeAccentColor || '#1A56DB');
    setLogoUrl(branding.badgeLogoUrl || '');
    setTagline(branding.badgeTagline || '');
    setVariant(branding.badgeDefaultVariant || 'academic');
  }, [branding.badgeAccentColor, branding.badgeLogoUrl, branding.badgeTagline, branding.badgeDefaultVariant]);

  const preview = useMutation({ mutationFn: api.getBadgePreview, onError: (error: Error) => setPreviewError(error.message) });
  const save = useMutation({ mutationFn: api.saveBranding, onSuccess: () => {
    setSuccess(true);
    onSaved?.({ ...branding, badgeAccentColor: accentColor, badgeLogoUrl: logoUrl || null, badgeTagline: tagline || null, badgeDefaultVariant: variant });
  } });
  const upload = useMutation({ mutationFn: api.uploadBrandingLogo, onSuccess: ({ logoUrl: url }) => { setLogoUrl(url); setValidationError(''); } });
  useEffect(() => {
    if (!institutionName || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(accentColor)) return;
    let cancelled = false;
    setPreviewError('');
    const timer = window.setTimeout(() => {
      api.getBadgePreview({ institutionName, credentialType: 'Academic', issueYear: String(new Date().getFullYear()), accentColor, logoUrl: logoUrl || undefined, variant })
        // getBadgePreview now returns a data URL (not blob URL), so no need to revoke
        .then(url => { if (!cancelled) setPreviewUrl(url); })
        .catch(error => { if (!cancelled) setPreviewError(error instanceof Error ? error.message : 'Unable to generate preview'); });
    }, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [institutionName, accentColor, logoUrl, tagline, variant, retry]);
  // No cleanup needed for data URLs (unlike blob URLs which need revokeObjectURL)

  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setValidationError('Choose a PNG, JPG, or SVG image no larger than 2 MB.'); return;
    }
    setValidationError(''); upload.mutate(file);
  };
  const handleSave = () => {
    if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(accentColor)) { setValidationError('Enter a valid hexadecimal color.'); return; }
    if (tagline.length > 40) { setValidationError('Tagline must be 40 characters or fewer.'); return; }
    setValidationError(''); setSuccess(false);
    save.mutate({ badgeAccentColor: accentColor, badgeLogoUrl: logoUrl || null, badgeTagline: tagline || null, badgeDefaultVariant: variant });
  };
  return <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
    <div className="space-y-6 min-w-0">
      <div className="space-y-2"><Label htmlFor="badge-color">Accent color</Label><div className="flex gap-2 items-center"><Input id="badge-color" value={accentColor} onChange={e => setAccentColor(e.target.value)} aria-invalid={!!validationError} maxLength={7} className="max-w-40" /><Input type="color" aria-label="Choose accent color" value={/^#[\da-f]{6}$/i.test(accentColor) ? accentColor : '#1A56DB'} onChange={e => setAccentColor(e.target.value)} className="w-14 p-1" /></div></div>
      <div className="space-y-2"><Label htmlFor="badge-logo">Institution logo</Label>{logoUrl && <img src={logoUrl} alt="Current institution logo" className="size-20 object-contain rounded-lg border bg-white" />}<Input id="badge-logo" type="file" accept="image/png,image/jpeg,image/svg+xml" disabled={upload.isPending} onChange={e => { handleLogo(e.target.files?.[0]); e.target.value = ''; }} /><p className="text-xs text-muted-foreground">PNG, JPG or SVG · maximum 2 MB</p>{upload.isPending && <p role="status">Uploading logo…</p>}{upload.isError && <p role="alert" className="text-sm text-destructive">{upload.error.message} <Button variant="outline" size="sm" onClick={() => { const input = document.getElementById('badge-logo') as HTMLInputElement | null; input?.click(); }}>Retry upload</Button></p>}</div>
      <div className="space-y-2"><Label htmlFor="badge-tagline">Tagline (optional)</Label><Input id="badge-tagline" value={tagline} maxLength={40} onChange={e => setTagline(e.target.value)} /><p className="text-xs text-muted-foreground">{tagline.length}/40 characters</p></div>
      <div className="space-y-2"><Label htmlFor="badge-variant">Badge variant</Label><Select value={variant} onValueChange={setVariant}><SelectTrigger id="badge-variant"><SelectValue /></SelectTrigger><SelectContent>{variants.map(({ value, label, icon: Icon, description }) => <SelectItem key={value} value={value}><span className="inline-flex items-center gap-2"><Icon className="size-4" />{label} — {description}</span></SelectItem>)}</SelectContent></Select></div>
      {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
      {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message} <Button variant="outline" size="sm" onClick={handleSave}>Retry</Button></p>}
      {success && <Badge variant="secondary" role="status">Branding saved</Badge>}
      <Button onClick={handleSave} disabled={save.isPending || upload.isPending}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Save branding</Button>
    </div>
    <div className="order-first lg:order-last space-y-3 text-center"><Label>Live badge preview</Label>{!institutionName ? <p className="text-sm text-muted-foreground">Institution name unavailable. Reload your profile to preview the badge.</p> : previewError ? <div role="alert" className="text-sm text-destructive">{previewError}<Button variant="outline" size="sm" className="ml-2" onClick={() => setRetry(value => value + 1)}>Retry</Button></div> : previewUrl ? <img src={previewUrl} alt={`${variant} badge for ${institutionName}`} className="mx-auto size-40 sm:size-52 object-contain" /> : <Skeleton className="mx-auto size-40 sm:size-52 rounded-full" />}<p className="text-xs text-muted-foreground">Only institution and credential information appears on the public badge.</p></div>
  </div>;
}
