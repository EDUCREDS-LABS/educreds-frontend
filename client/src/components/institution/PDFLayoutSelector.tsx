import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, CreditCard, FileText, Loader2, ScrollText, Award, Shield, Calendar, User } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { CredentialBranding } from './BadgeCustomizationPanel';

// Visual preview component for each layout
function LayoutPreview({ layout, isSelected }: { layout: string; isSelected: boolean }) {
  const accentColor = '#2563eb';

  if (layout === 'classic') {
    return (
      <div className="relative w-full aspect-[1.4] bg-amber-50 rounded-lg border-2 border-amber-200 overflow-hidden">
        {/* Ornamental border */}
        <div className="absolute inset-2 border border-amber-300/50 rounded-md" />
        <div className="absolute inset-3 border border-amber-400/30 rounded-sm" />
        {/* Header */}
        <div className="absolute top-6 left-0 right-0 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-2">
            <Shield className="w-6 h-6 text-amber-700" />
          </div>
          <div className="text-[8px] font-bold text-amber-800 uppercase tracking-wider">Certificate of Achievement</div>
        </div>
        {/* Content */}
        <div className="absolute top-20 left-4 right-4 space-y-2">
          <div className="h-2 bg-amber-200/50 rounded w-3/4 mx-auto" />
          <div className="h-1.5 bg-amber-200/30 rounded w-1/2 mx-auto" />
          <div className="h-1 bg-amber-200/20 rounded w-2/3 mx-auto mt-3" />
          <div className="h-1 bg-amber-200/20 rounded w-1/2 mx-auto" />
        </div>
        {/* Footer signatures */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <div className="text-center">
            <div className="w-16 h-0.5 bg-amber-400/40 mb-1" />
            <div className="text-[6px] text-amber-700/70">Registrar</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-0.5 bg-amber-400/40 mb-1" />
            <div className="text-[6px] text-amber-700/70">Date</div>
          </div>
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-white rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (layout === 'modern') {
    return (
      <div className="relative w-full aspect-[1.4] bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        {/* Clean header bar */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900 flex items-center px-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center">
              <Award className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[7px] font-semibold text-white">Institution Name</span>
          </div>
        </div>
        {/* Content */}
        <div className="absolute top-12 left-4 right-4">
          <div className="text-[8px] font-bold text-slate-900 uppercase tracking-wide mb-3">Credential Title</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-slate-400" />
              <div className="h-1.5 bg-slate-200 rounded w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-slate-400" />
              <div className="h-1.5 bg-slate-200 rounded w-12" />
            </div>
          </div>
          {/* Verification badge */}
          <div className="mt-4 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[6px] font-medium text-emerald-700">Verified</span>
          </div>
        </div>
        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900" />
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-white rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact layout
  return (
    <div className="relative w-full aspect-[1.4] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden">
      {/* Card-style layout */}
      <div className="absolute inset-3 bg-white rounded-lg shadow-sm border border-slate-100">
        {/* Badge at top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Award className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Content */}
        <div className="absolute top-8 left-3 right-3 text-center">
          <div className="text-[7px] font-bold text-slate-900">Credential Name</div>
          <div className="text-[6px] text-slate-500 mt-1">Issued to Student Name</div>
          {/* Mini details */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded px-2 py-1">
              <div className="text-[5px] text-slate-400 uppercase">Date</div>
              <div className="text-[6px] font-medium text-slate-700">2025</div>
            </div>
            <div className="bg-slate-50 rounded px-2 py-1">
              <div className="text-[5px] text-slate-400 uppercase">Type</div>
              <div className="text-[6px] font-medium text-slate-700">Workshop</div>
            </div>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-primary/10 flex items-center justify-center">
          <span className="text-[5px] font-medium text-primary">educreds.io/verify</span>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1">
          <div className="bg-primary text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
}

const layouts = [
  { id: 'classic', title: 'Classic', icon: ScrollText, description: 'Formal academic style with ornamental border. Best for university degrees and diplomas.' },
  { id: 'modern', title: 'Modern', icon: FileText, description: 'Clean, minimal design with clear typography. Best for professional and technical credentials.' },
  { id: 'compact', title: 'Compact', icon: CreditCard, description: 'Card-style layout with badge. Best for short courses, workshops, and badges.' },
] as const;

export function PDFLayoutSelector({ branding, onSaved }: { branding: CredentialBranding; onSaved?: (value: CredentialBranding) => void }) {
  const [layout, setLayout] = useState(branding.pdfLayout || 'classic');
  const [signatureUrl, setSignatureUrl] = useState(branding.pdfSignatureUrl || '');
  const [signatureError, setSignatureError] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => { setLayout(branding.pdfLayout || 'classic'); setSignatureUrl(branding.pdfSignatureUrl || ''); }, [branding.pdfLayout, branding.pdfSignatureUrl]);
  const save = useMutation({ mutationFn: api.saveBranding, onSuccess: () => { setSuccess(true); onSaved?.({ ...branding, pdfLayout: layout, pdfSignatureUrl: signatureUrl || null }); } });
  const handleSignature = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setSignatureError('Choose a PNG or JPG signature image no larger than 2 MB.'); return;
    }
    // A dedicated signature asset endpoint is required: the institution logo endpoint overwrites the public logo.
    setSignatureError('Signature upload is not available on this server. Your existing signature remains unchanged.');
  };
  return <div className="space-y-6">
    <div role="radiogroup" aria-label="PDF certificate layout" className="grid gap-4 sm:grid-cols-3">
      {layouts.map(({ id, title, icon: Icon, description }) => (
        <Card
          key={id}
          role="radio"
          aria-checked={layout === id}
          tabIndex={0}
          onClick={() => { setLayout(id); setSuccess(false); }}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setLayout(id); } }}
          className={`cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary transition-all ${layout === id ? 'border-primary ring-2 ring-primary shadow-lg' : 'hover:border-primary/50 hover:shadow-md'}`}
        >
          <CardContent className="p-4 space-y-3">
            {/* Visual Preview */}
            <LayoutPreview layout={id} isSelected={layout === id} />
            {/* Selection indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h4 className="font-semibold text-sm">{title}</h4>
              </div>
              {layout === id && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none">
                  Selected
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="space-y-2">
      <Label htmlFor="pdf-signature">Registrar or dean signature (optional)</Label>
      {signatureUrl && <img src={signatureUrl} alt="Current signature" className="max-h-20 max-w-52 object-contain rounded border bg-white" />}
      <Input id="pdf-signature" type="file" accept="image/png,image/jpeg" onChange={event => { handleSignature(event.target.files?.[0]); event.target.value = ''; }} />
      <p className="text-xs text-muted-foreground">PNG or JPG · maximum 2 MB. Existing signature is retained when saving layout.</p>
      {signatureError && <p role="alert" className="text-sm text-destructive">{signatureError}</p>}
    </div>
    {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message} <Button variant="outline" size="sm" onClick={() => save.mutate({ pdfLayout: layout, pdfSignatureUrl: signatureUrl || null })}>Retry</Button></p>}
    {success && <p role="status" className="text-sm text-green-700 dark:text-green-400">PDF layout saved.</p>}
    <Button disabled={save.isPending} onClick={() => { setSuccess(false); save.mutate({ pdfLayout: layout, pdfSignatureUrl: signatureUrl || null }); }}>
      {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
      Save PDF layout
    </Button>
  </div>;
}
