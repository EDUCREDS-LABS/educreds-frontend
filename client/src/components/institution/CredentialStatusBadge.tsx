import { cn } from "@/lib/utils";

export type CredentialState = "active" | "pending" | "failed" | "revoked" | "archived";

/** Single source of truth for how a credential's lifecycle state is derived and shown. */
export function credentialState(c: { isValid?: boolean; isMinted?: boolean; isArchived?: boolean; issuanceStatus?: string }): CredentialState {
  if (c.isArchived) return "archived";
  if (c.isValid === false) return "revoked";
  if (c.issuanceStatus === "failed") return "failed";
  if (c.isMinted) return "active";
  return "pending";
}

const STYLES: Record<CredentialState, { label: string; cls: string; hint: string }> = {
  active:   { label: "Active",   cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", hint: "Signed and anchored. Verifies as valid." },
  pending:  { label: "Pending",  cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", hint: "Signed; blockchain anchoring is queued." },
  failed:   { label: "Failed",   cls: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400", hint: "Anchoring failed. Retry from the credential detail." },
  revoked:  { label: "Revoked",  cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300", hint: "Withdrawn by the institution." },
  archived: { label: "Archived", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400", hint: "Hidden from default lists." },
};

export function CredentialStatusBadge({ state }: { state: CredentialState }) {
  const s = STYLES[state];
  return (
    <span title={s.hint} data-testid={`credential-status-${state}`} className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium", s.cls)}>
      {s.label}
    </span>
  );
}
