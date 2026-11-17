# BDA Training Funnel

Two-page funnel for BDA Technologies, separate from the main website:

| Page | URL | What it does |
| --- | --- | --- |
| Free training | `/free-training` | Locked Vimeo training: no skipping ahead, speed menu, "Book my call" unlocks after `UNLOCK_SECONDS` of watching. Progress is saved in the browser. |
| Thank you | `/thank-you-call` | "Your call is confirmed", save contact (vCard), confirm on WhatsApp, reschedule, testimonials, FAQ. Fires the booking conversion once per Calendly booking. |

`/` redirects to `/free-training` (UTM params are kept).

## All settings live in one file

[`src/config/funnel.ts`](src/config/funnel.ts): video ID, unlock time, Calendly links, phone / WhatsApp, copy, testimonials, FAQ, legal links, Meta Pixel and GTM / GA4 IDs. Everything marked `TODO` must be filled in before going live.

Currently set for **testing only**:
- `VIMEO_VIDEO_ID` is a 14:48 public test video (Sintel).
- `BOOKING_URL` points straight to `/thank-you-call`. Replace it with the Calendly event URL.

## Calendly

In the Calendly event: **Confirmation page → Redirect to an external site** → `https://<funnel-domain>/thank-you-call`, with **Pass event details to your redirected page** turned on.

## Run locally

```sh
bun install    # or: npx bun@1 install
bun dev        # or: npm run dev
```

Then open `http://localhost:<port>/free-training`. For quick testing set `UNLOCK_SECONDS: 60` (put it back to 600 afterwards). Reset your own progress by clearing the `bda_training_progress_<videoId>` key in localStorage.

## Build and deploy

```sh
bun run build
```

Deploy with the included `Dockerfile` (Node server on port 3000), e.g. on Coolify, the same way as the main website.

## Tracking

- UTM / click IDs (fbclid, gclid, wbraid, gbraid, _fbp, _fbc) are saved on landing and appended to the booking link. Ad clicks win over later organic visits for 30 days.
- `window.dataLayer` events: `training_play`, `training_progress_25/50/75`, `booking_unlocked`, `book_click`, `booking_confirmed`.
- Meta Pixel `Schedule` with `eventID = "mtg_" + invitee_uuid`. The server-side Conversions API call is a stub: see `src/lib/booking.functions.ts`, then set `META_CAPI_ENABLED: true`.
