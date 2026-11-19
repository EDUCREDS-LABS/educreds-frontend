import { ShieldCheck } from 'lucide-react';

export default function BatchSigningSettings() {
  return (
    <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">Credential Signing Authority</h3>
          <p className="text-sm text-neutral-500 font-medium leading-relaxed">
            All credentials issued by your institution are cryptographically signed by EduCreds on your behalf using your institution's embedded identity. No manual key management is required.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Platform Managed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
