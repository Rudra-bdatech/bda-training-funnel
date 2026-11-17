import { useEffect } from "react";

/**
 * Site-wide UTM / click-ID capture.
 *
 * Rule: "ad clicks win". A visit with a click ID (fbclid, gclid, wbraid, gbraid)
 * or paid-looking UTMs overwrites whatever is saved and stamps an ad timestamp.
 * A later organic visit (WhatsApp, email, YouTube, direct…) within
 * AD_ATTRIBUTION_DAYS does NOT overwrite the saved ad attribution.
 */

const STORAGE_KEY = "bda_attribution";
const AD_ATTRIBUTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
export const CLICK_ID_KEYS = ["fbclid", "gclid", "wbraid", "gbraid"] as const;
const COOKIE_KEYS = ["_fbp", "_fbc"] as const;

type AttributionKey =
  | (typeof UTM_KEYS)[number]
  | (typeof CLICK_ID_KEYS)[number]
  | (typeof COOKIE_KEYS)[number];

export type AttributionParams = Partial<Record<AttributionKey, string>>;

type StoredAttribution = {
  params: AttributionParams;
  /** When the saved params came from an ad click (ms since epoch). */
  adTs?: number;
  /** Last time the params were written. */
  updatedTs: number;
  landingPage?: string;
};

const PAID_MEDIUM =
  /^(cpc|ppc|cpm|cpv|cpa|paid|paid[_-]?social|paidsocial|paid[_-]?search|display|ads?|banner|retargeting|remarketing)$/i;

function safeGet(): StoredAttribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAttribution) : null;
  } catch {
    return null;
  }
}

function safeSet(value: StoredAttribution) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage blocked — ignore */
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function pick(search: URLSearchParams, keys: readonly AttributionKey[]): AttributionParams {
  const out: AttributionParams = {};
  for (const k of keys) {
    const v = search.get(k)?.trim();
    if (v) out[k] = v.slice(0, 500);
  }
  return out;
}

function isPaidVisit(p: AttributionParams): boolean {
  if (CLICK_ID_KEYS.some((k) => p[k])) return true;
  return !!p.utm_medium && PAID_MEDIUM.test(p.utm_medium);
}

/** Capture attribution from the current URL + cookies. Safe to call on every page load. */
export function captureAttribution(href: string = window.location.href) {
  const url = new URL(href);
  const fromUrl = pick(url.searchParams, [...UTM_KEYS, ...CLICK_ID_KEYS]);
  const now = Date.now();
  const saved = safeGet();

  // Browser identifiers from the Meta Pixel. Build _fbc from fbclid if the pixel hasn't yet.
  const cookies: AttributionParams = {};
  const fbp = readCookie("_fbp");
  const fbc = readCookie("_fbc") ?? (fromUrl.fbclid ? `fb.1.${now}.${fromUrl.fbclid}` : undefined);
  if (fbp) cookies._fbp = fbp;
  if (fbc) cookies._fbc = fbc;

  const hasUrlParams = Object.keys(fromUrl).length > 0;
  const adStillValid = !!saved?.adTs && now - saved.adTs < AD_ATTRIBUTION_DAYS * DAY_MS;

  let next: StoredAttribution;

  if (isPaidVisit(fromUrl)) {
    // Ad clicks win: replace everything.
    next = {
      params: { ...fromUrl, ...cookies },
      adTs: now,
      updatedTs: now,
      landingPage: url.pathname,
    };
  } else if (hasUrlParams && !adStillValid) {
    // Organic visit with UTMs and no recent ad click: take the new values.
    next = {
      params: { ...fromUrl, ...cookies },
      updatedTs: now,
      landingPage: url.pathname,
    };
  } else if (saved) {
    // Direct visit, or organic visit inside the ad window: keep saved attribution,
    // only refresh the browser identifiers.
    next = { ...saved, params: { ...saved.params, ...cookies } };
  } else if (Object.keys(cookies).length) {
    next = { params: cookies, updatedTs: now };
  } else {
    return;
  }

  safeSet(next);
}

export function getAttribution(): AttributionParams {
  if (typeof window === "undefined") return {};
  return safeGet()?.params ?? {};
}

/** Append every saved attribution param to a URL (existing params on the URL are kept). */
export function withAttribution(baseUrl: string): string {
  if (typeof window === "undefined") return baseUrl;
  try {
    // Relative paths ("/thank-you-call") resolve against the current site.
    const url = new URL(baseUrl, window.location.origin);
    for (const [k, v] of Object.entries(getAttribution())) {
      if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/** Runs attribution capture once per full page load. Mount once in the root layout. */
export function useAttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
}
