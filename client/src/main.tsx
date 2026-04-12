import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://10032623fa6e2fb9592a2e8e0d9c7251@o4510986577248256.ingest.us.sentry.io/4511184285007872",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Enable logs to be sent to Sentry
  enableLogs: true
});

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Ensure React is available globally for UI components
if (typeof window !== 'undefined') {
  (window as any).React = React;
}
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "./index.css";
import { initializeGoogleAnalytics } from "./lib/analytics";
import { initializeCookiebot } from "./lib/consent";

// Display EDUCREDS banner
console.log(`
/* ███████╗██████╗ ██╗   ██╗ ██████╗██████╗ ███████╗██████╗ ███████╗ */
/* ██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██╔══██╗██╔════╝ */
/* █████╗  ██║  ██║██║   ██║██║     ██████╔╝█████╗  ██║  ██║███████╗ */
/* ██╔══╝  ██║  ██║██║   ██║██║     ██╔══██╗██╔══╝  ██║  ██║╚════██║ */
/* ███████╗██████╔╝╚██████╔╝╚██████╗██║  ██║███████╗██████╔╝███████║ */
/* ╚══════╝╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝ */
`);

if (import.meta.env.PROD) {
  initializeCookiebot();
  initializeGoogleAnalytics();
}

createRoot(document.getElementById("root")!).render(<App />);
