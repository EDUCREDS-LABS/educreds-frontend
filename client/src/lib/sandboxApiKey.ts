import { getAuthHeaders } from '@/lib/auth';

const STORAGE_KEY = 'educreds_sandbox_api_key';

export function rememberSandboxApiKey(secret: string | undefined | null): void {
  if (!secret || typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, secret);
}

export function getSandboxApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

/** Prefer the remembered sandbox secret (X-API-Key) and keep the session token. */
export function explorerAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { ...getAuthHeaders() };
  const sandbox = getSandboxApiKey();
  if (sandbox) {
    headers['X-API-Key'] = sandbox;
  }
  return headers;
}
