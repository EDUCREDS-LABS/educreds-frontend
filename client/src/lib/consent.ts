const COOKIEBOT_SCRIPT_ID = "cookiebot-script";
const cookiebotId = import.meta.env.VITE_COOKIEBOT_ID?.trim();

function hasCookiebotId(): boolean {
  return Boolean(cookiebotId);
}

function injectCookiebotScript(): void {
  if (!hasCookiebotId() || document.getElementById(COOKIEBOT_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = COOKIEBOT_SCRIPT_ID;
  script.src = "https://consent.cookiebot.com/uc.js";
  script.async = true;
  script.dataset.cbid = cookiebotId as string;
  script.type = "text/javascript";
  document.head.appendChild(script);
}

export function initializeCookiebot(): void {
  if (!hasCookiebotId()) {
    return;
  }

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
      injectCookiebotScript();
    });
    return;
  }

  window.setTimeout(() => {
    injectCookiebotScript();
  }, 1500);
}
