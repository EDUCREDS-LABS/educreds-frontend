/**
 * fix(seo): per-route meta tags for social sharing (fix/frontend-audit-aug9)
 * Uses document.title + meta tag injection since react-helmet-async may not be installed.
 * Works with any deployment without adding a new dep.
 */
import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
}

const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1775814532/10.04.2026_15.46.38_REC_n4qsha.png";
const BASE_URL = "https://educreds.xyz";

export function PageMeta({ title, description, url, image }: PageMetaProps) {
  const fullTitle = `${title} | EduCreds`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const img = image || DEFAULT_IMAGE;

  useEffect(() => {
    // Title
    document.title = fullTitle;
    // Description
    setMeta("name", "description", description);
    // OG
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:image", img);
    // Twitter
    setMeta("property", "twitter:title", fullTitle);
    setMeta("property", "twitter:description", description);
    setMeta("property", "twitter:url", fullUrl);
    setMeta("property", "twitter:image", img);
    // Canonical
    let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (link) link.href = fullUrl;

    return () => {
      document.title = "EduCreds - Decentralized Academic Credentialing Infrastructure";
    };
  }, [fullTitle, description, fullUrl, img]);

  return null;
}

function setMeta(attrKey: string, attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrKey}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrKey, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}
