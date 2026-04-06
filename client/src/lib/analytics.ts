declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_SCRIPT_ID = 'ga4-script';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

function hasGaMeasurementId(): boolean {
  return Boolean(measurementId);
}

function scheduleGaScript(): void {
  if (!hasGaMeasurementId() || document.getElementById(GA_SCRIPT_ID)) {
    return;
  }

  const inject = () => {
    if (document.getElementById(GA_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  };

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(inject);
    return;
  }

  window.setTimeout(inject, 1500);
}

export function trackPageView(path = `${window.location.pathname}${window.location.search}`): void {
  if (!hasGaMeasurementId() || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
  });
}

export function initializeGoogleAnalytics(): void {
  if (!hasGaMeasurementId()) {
    return;
  }

  scheduleGaScript();

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer.push(args); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  trackPageView();

  const onHistoryChange = () => trackPageView();
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  (window.history.pushState as any) = function pushState(...args: any[]) {
    originalPushState(...args);
    onHistoryChange();
  };

  (window.history.replaceState as any) = function replaceState(...args: any[]) {
    originalReplaceState(...args);
    onHistoryChange();
  };

  window.addEventListener('popstate', onHistoryChange);
}
