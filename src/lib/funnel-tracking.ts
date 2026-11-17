import { FUNNEL } from "@/config/funnel";

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: FbqFn;
    _fbq?: FbqFn;
    gtag?: (...args: unknown[]) => void;
  }
}

/** Push an event to window.dataLayer (GTM / GA4 pick it up when installed). */
export function trackEvent(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...data });
}

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Load Meta Pixel and GTM / GA4, but only for IDs that are set in the funnel config. Idempotent. */
export function loadFunnelTracking() {
  if (typeof window === "undefined") return;

  const pixelId = FUNNEL.META_PIXEL_ID.trim();
  if (pixelId && !window.fbq) {
    const fbq: FbqFn = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    injectScript("meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", pixelId);
    fbq("track", "PageView");
  }

  const tagId = FUNNEL.GOOGLE_TAG_ID.trim();
  if (tagId && !document.getElementById("google-tag")) {
    window.dataLayer = window.dataLayer || [];
    if (tagId.startsWith("GTM-")) {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      injectScript("google-tag", `https://www.googletagmanager.com/gtm.js?id=${tagId}`);
    } else {
      injectScript("google-tag", `https://www.googletagmanager.com/gtag/js?id=${tagId}`);
      window.gtag = function gtag() {
        // gtag requires the raw `arguments` object, not an array.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
      };
      window.gtag("js", new Date());
      window.gtag("config", tagId);
    }
  }
}

// ------------------------------------------------------------ In-app browsers

export type InAppBrowser = {
  name: "Instagram" | "Facebook" | "WhatsApp" | "Telegram" | "Snapchat";
  os: "android" | "ios" | "other";
};

export function detectInAppBrowser(): InAppBrowser | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  const os: InAppBrowser["os"] = /android/i.test(ua)
    ? "android"
    : /iphone|ipad|ipod/i.test(ua)
      ? "ios"
      : "other";

  if (/Instagram/i.test(ua)) return { name: "Instagram", os };
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) return { name: "Facebook", os };
  if (/WhatsApp/i.test(ua)) return { name: "WhatsApp", os };
  if (/Snapchat/i.test(ua)) return { name: "Snapchat", os };
  const w = window as unknown as Record<string, unknown>;
  if (/Telegram/i.test(ua) || w.TelegramWebview || w.TelegramWebviewProxy) {
    return { name: "Telegram", os };
  }
  return null;
}

/** URL that asks the OS to open the current page in a real browser, if one exists for this webview. */
export function externalBrowserUrl(app: InAppBrowser, href: string): string | null {
  if (app.os === "android") {
    const url = new URL(href);
    const scheme = url.protocol.replace(":", "");
    return `intent://${url.host}${url.pathname}${url.search}${url.hash}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`;
  }
  if (app.os === "ios" && app.name === "Instagram") {
    return `instagram://extbrowser/?url=${encodeURIComponent(href)}`;
  }
  return null;
}

// ----------------------------------------------------------------- vCard

function vcardEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

/** Generate a vCard for the team and trigger a download. */
export function downloadTeamVCard() {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vcardEscape(FUNNEL.TEAM_DISPLAY_NAME)}`,
    `N:;${vcardEscape(FUNNEL.TEAM_DISPLAY_NAME)};;;`,
    `ORG:${vcardEscape(FUNNEL.TEAM_ORGANISATION)}`,
    `TEL;TYPE=CELL,VOICE:${FUNNEL.TEAM_PHONE}`,
    FUNNEL.TEAM_EMAIL ? `EMAIL;TYPE=WORK:${FUNNEL.TEAM_EMAIL}` : "",
    FUNNEL.TEAM_WEBSITE ? `URL:${FUNNEL.TEAM_WEBSITE}` : "",
    "END:VCARD",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${FUNNEL.TEAM_ORGANISATION.replace(/\s+/g, "-")}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function whatsappUrl() {
  return `https://wa.me/${FUNNEL.WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(FUNNEL.WHATSAPP_MESSAGE)}`;
}

/** "+919876543210" -> "+91 98765 43210" style display (best-effort). */
export function formatPhone(phone: string) {
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}
