const AUTH_KEYS = [
  "institution_token",
  "institution_user",
  "marketplace_token",
  "marketplace_user",
  "student_token",
  "student_user",
  "developer_token",
  "developer_user",
  "verifier_token",
  "verifier_user",
  "government_token",
  "government_user",
  "auth_type",
  "authToken",
] as const;

type AuthStorageKey = (typeof AUTH_KEYS)[number];
type AuthTypeValue = "institution" | "marketplace" | "student" | "developer" | "verifier" | "government";

const hasWindow = () => typeof window !== "undefined";

export const getAuthItem = (key: AuthStorageKey): string | null => {
  if (!hasWindow()) return null;

  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) return sessionValue;

  const legacyValue = window.localStorage.getItem(key);
  if (legacyValue) {
    window.sessionStorage.setItem(key, legacyValue);
    window.localStorage.removeItem(key);
    return legacyValue;
  }

  return null;
};

// Keys that should persist across tab closes (non-sensitive session tokens that
// need to survive mobile browser background kills and tab re-opens).
const PERSISTENT_KEYS: AuthStorageKey[] = [
  "student_token",
  "student_user",
  "auth_type",
];

export const setAuthItem = (key: AuthStorageKey, value: string) => {
  if (!hasWindow()) return;
  window.sessionStorage.setItem(key, value);
  // For student auth (and auth_type), also persist in localStorage so mobile
  // browsers that kill background tabs can recover the session on re-open.
  if (PERSISTENT_KEYS.includes(key)) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
};

export const removeAuthItem = (key: AuthStorageKey) => {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(key);
  window.localStorage.removeItem(key);
};

export const clearAuthStorage = () => {
  AUTH_KEYS.forEach((key) => removeAuthItem(key));
};

export const getAuthTypeFromStorage = (): AuthTypeValue | null => {
  const authType = getAuthItem("auth_type");
  const valid: AuthTypeValue[] = ["institution", "marketplace", "student", "developer", "verifier", "government"];
  if (valid.includes(authType as AuthTypeValue)) return authType as AuthTypeValue;
  return null;
};

export const getInstitutionToken = () => getAuthItem("institution_token");

// Staff allowed tabs — stored as JSON array in sessionStorage
// Set by staff management page after owner configures member tabs.
// Empty array = unrestricted (owner / admin).
export const getStaffAllowedTabs = (): string[] | null => {
  if (!hasWindow()) return null;
  const raw = window.sessionStorage.getItem('staff_allowed_tabs');
  if (!raw) return null;
  try { return JSON.parse(raw) as string[]; } catch { return null; }
};
export const setStaffAllowedTabs = (tabs: string[]): void => {
  if (!hasWindow()) return;
  window.sessionStorage.setItem('staff_allowed_tabs', JSON.stringify(tabs));
};
export const clearStaffAllowedTabs = (): void => {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem('staff_allowed_tabs');
};
export const getMarketplaceToken = () => getAuthItem("marketplace_token");
export const getStudentToken    = () => getAuthItem("student_token");
export const getDeveloperToken  = () => getAuthItem("developer_token");
export const getVerifierToken   = () => getAuthItem("verifier_token");
export const getGovernmentToken = () => getAuthItem("government_token");

export const getAnyAuthToken = () =>
  getInstitutionToken() ||
  getMarketplaceToken() ||
  getStudentToken()     ||
  getDeveloperToken()   ||
  getVerifierToken()    ||
  getGovernmentToken()  ||
  getAuthItem("authToken");

export const getSessionBackedItem = (key: string): string | null => {
  if (!hasWindow()) return null;
  const sessionValue = window.sessionStorage.getItem(key);
  if (sessionValue) return sessionValue;
  const legacyValue = window.localStorage.getItem(key);
  if (legacyValue) {
    window.sessionStorage.setItem(key, legacyValue);
    window.localStorage.removeItem(key);
    return legacyValue;
  }
  return null;
};

export const setSessionBackedItem = (key: string, value: string) => {
  if (!hasWindow()) return;
  window.sessionStorage.setItem(key, value);
  window.localStorage.removeItem(key);
};

export const removeSessionBackedItem = (key: string) => {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(key);
  window.localStorage.removeItem(key);
};
