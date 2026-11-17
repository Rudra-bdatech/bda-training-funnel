import { useEffect, useState } from "react";
import { Copy, ExternalLink, VolumeX, X } from "lucide-react";
import { detectInAppBrowser, externalBrowserUrl, type InAppBrowser } from "@/lib/funnel-tracking";

const DISMISS_KEY = "bda_inapp_notice_dismissed";

/** Shown only inside Instagram / Facebook / WhatsApp / Telegram / Snapchat webviews. */
export function InAppBrowserNotice() {
  const [app, setApp] = useState<InAppBrowser | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    setApp(detectInAppBrowser());
  }, []);

  if (!app) return null;

  const href = window.location.href;
  const openUrl = externalBrowserUrl(app, href);

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setApp(null);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      const input = document.createElement("input");
      input.value = href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="relative mx-auto mb-6 max-w-3xl rounded-2xl border border-amber-300/70 bg-amber-50 p-4 pr-10 text-amber-950 shadow-soft">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-amber-900/70 hover:bg-amber-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <VolumeX className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">No sound? Open this page in your browser</p>
          <p className="mt-1 text-sm text-amber-900/80">
            {app.name}'s built-in browser can block video sound and save your progress unreliably.
            {!openUrl && " Tap ⋯ or the share icon and choose “Open in browser”, or copy the link."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {openUrl && (
              <a
                href={openUrl}
                className="inline-flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-medium text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {app.os === "android" ? "Open in Chrome" : "Open in browser"}
              </a>
            )}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full border border-amber-900/30 bg-white px-4 py-2 text-sm font-medium"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
