// ── ALL imports MUST be at the top — no code between them ────────────────────
import * as Sentry from "@sentry/react";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
/* Typography: Sora loaded via Google Fonts in index.html (site-wide). */
import "./index.css";
import { DEV_BYPASS_AUTH, ensureDevBypassSession } from "@/lib/devBypass";
import { initializeGoogleAnalytics } from "./lib/analytics";
import { initializeCookiebot } from "./lib/consent";
import { reportWebVitals } from "./lib/reportWebVitals";

// ── Sentry init (must run before any render) ─────────────────────────────────
if (!(globalThis as any).__SENTRY_INITIALIZED__) {
  try {
    Sentry.init({
      dsn: "https://10032623fa6e2fb9592a2e8e0d9c7251@o4510984577248256.ingest.us.sentry.io/4511184285007872",
      sendDefaultPii: false,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ["localhost", /^https:\/\/api-dev\.educreds\.xyz/],
      enableLogs: true,
      // Ignore known browser-extension / Chrome autofill noise that is not
      // caused by app code. These unhandled rejections originate from Chrome's
      // built-in password-manager IPC trying to update form fields that React
      // has already unmounted, and from common browser extensions.
      ignoreErrors: [
        // Chrome password-manager / autofill internal messaging
        /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
        // Generic non-Error promise rejection noise from extensions
        "Non-Error promise rejection captured",
        // ResizeObserver benign loop notifications
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
      ],
    });
    (globalThis as any).__SENTRY_INITIALIZED__ = true;
  } catch (e) {
    console.warn("[EduCreds] Sentry init failed:", e);
  }
}

// ── Dev bypass ───────────────────────────────────────────────────────────────
if (DEV_BYPASS_AUTH) {
  ensureDevBypassSession();
}

// ── Expose React globally (some legacy components rely on window.React) ───────
if (typeof window !== "undefined") {
  (window as any).React = React;
}

// ── Production-only analytics ────────────────────────────────────────────────
if (import.meta.env.PROD) {
  try { initializeCookiebot(); } catch (e) { /* optional */ }
  try { initializeGoogleAnalytics(); } catch (e) { /* optional */ }
  try { reportWebVitals(); } catch (e) { /* optional */ }
}

// ── Root error boundary — surfaces crashes as red box instead of blank page ───
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[EduCreds] Root render error:", error, info);

    // Auto-recover from stale chunk errors (after a new deployment, old
    // lazy-loaded JS chunks no longer exist on the CDN). Detect by message
    // pattern and force a hard reload — but only once to avoid reload loops.
    const isChunkError =
      error.message?.includes("dynamically imported module") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.toLowerCase().includes("loading chunk") ||
      error.message?.toLowerCase().includes("loading css chunk");

    if (isChunkError) {
      const reloadKey = "ec_chunk_reload_ts";
      const lastReload = parseInt(sessionStorage.getItem(reloadKey) ?? "0", 10);
      const now = Date.now();
      // Only auto-reload if we haven't tried within the last 10 seconds
      if (now - lastReload > 10_000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn("[EduCreds] Stale chunk detected — reloading page to pick up latest assets.");
        window.location.reload();
      }
    }
  }
  render() {
    if (this.state.error) {
      const isChunkError =
        this.state.error.message?.includes("dynamically imported module") ||
        this.state.error.message?.includes("Failed to fetch") ||
        this.state.error.message?.toLowerCase().includes("loading chunk");

      if (isChunkError) {
        // Show a friendly refresh prompt instead of the raw error
        return (
          <div style={{
            fontFamily: "system-ui, sans-serif", padding: "48px 24px", maxWidth: "480px",
            margin: "80px auto", textAlign: "center",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111", marginBottom: "8px" }}>
              Update available
            </h2>
            <p style={{ color: "#666", marginBottom: "24px", lineHeight: 1.6 }}>
              EduCreds was updated. Reload the page to get the latest version.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#4f46e5", color: "#fff", border: "none", padding: "12px 32px",
                borderRadius: "12px", fontWeight: 800, fontSize: "14px", cursor: "pointer",
              }}
            >
              Reload now
            </button>
          </div>
        );
      }

      return (
        <div style={{
          fontFamily: "monospace", padding: "40px", maxWidth: "800px",
          margin: "40px auto", background: "#fff1f0", border: "1px solid #ff4d4f",
          borderRadius: "8px",
        }}>
          <h2 style={{ color: "#cf1322" }}>EduCreds — Startup Error</h2>
          <p style={{ color: "#333" }}>The application failed to initialise. Please report this error:</p>
          <pre style={{
            background: "#fff", padding: "16px", borderRadius: "4px",
            overflow: "auto", fontSize: "12px", color: "#c41d7f",
          }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Mount ─────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
