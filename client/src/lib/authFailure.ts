import { clearAuthStorage } from "./authStorage";

const AUTH_FAILURE_STATUSES = new Set([401, 403]);
let authRecoveryInProgress = false;

interface HttpClientErrorData {
  message?: string;
  error?: string;
  details?: string;
}

interface HttpClientError {
  response?: {
    status?: number;
    data?: HttpClientErrorData;
  };
  message?: string;
}

export function recoverFromUnauthorized(): void {
  if (typeof window === "undefined" || authRecoveryInProgress) {
    return;
  }

  authRecoveryInProgress = true;
  try {
    clearAuthStorage();

    const path = window.location.pathname || "/";
    const isProtectedPath =
      path.startsWith("/institution") ||
      path.startsWith("/admin");
    const isAlreadyOnLogin =
      path === "/login" ||
      path === "/admin/login";

    if (isProtectedPath && !isAlreadyOnLogin) {
      window.location.href = "/login";
    }
  } finally {
    setTimeout(() => {
      authRecoveryInProgress = false;
    }, 1000);
  }
}

function toHttpClientError(error: unknown): HttpClientError {
  return (error ?? {}) as HttpClientError;
}

function extractErrorMessage(error: HttpClientError): string {
  const data = error.response?.data;
  return data?.message || data?.error || data?.details || error.message || "Request failed";
}

export function handleAuthFailure(rawError: unknown): Error {
  const error = toHttpClientError(rawError);
  const status = error.response?.status;
  if (typeof status === "number" && AUTH_FAILURE_STATUSES.has(status)) {
    recoverFromUnauthorized();
    return new Error("Authentication failed. Please sign in again.");
  }

  return new Error(extractErrorMessage(error));
}
