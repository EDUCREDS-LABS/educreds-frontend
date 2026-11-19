declare global {
  interface Window {
    __APP_ENV__?: string;
    __SUBDOMAIN__?: string;
    __CANONICAL_URL__?: string;
  }
}

export {};
