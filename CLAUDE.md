# CLAUDE.md

Context for Claude Code working in this repo.

## What this is

A standalone 2-page "free training video → book a call" funnel for BDA Technologies.
It is deliberately **separate from the main website repo** (decision from management): do not
add these pages back into the website repo.

- `/free-training`: locked Vimeo training. "Book my call" unlocks after `UNLOCK_SECONDS` of watching.
- `/thank-you-call`: booking confirmation (vCard, WhatsApp confirm, reschedule, testimonials, FAQ, booking tracking).
- `/` redirects to `/free-training`, keeping the query string (UTMs).

Repo: https://github.com/Rudra-bdatech/bda-training-funnel (public; branch `main`).
Commit and push only when the user asks.

## Stack

React 19 + TypeScript, TanStack Start (file routes in `src/routes`), Tailwind v4, Framer Motion,
`@vimeo/player`. Built with `@lovable.dev/vite-tanstack-config` (same setup as the main website).
Brand tokens and fonts (Archivo + Inter, olive `#556b2f`) are copied from the website's
`rewrite` branch in `src/styles.css`. Deployed with the `Dockerfile` (Node server, port 3000), intended for Coolify.

Bun is not installed globally on this machine: use `npx bun@1 install` (keeps `bun.lock` in sync), `npm run dev`,
`npm run build`. Type check: `./node_modules/.bin/tsc --noEmit -p .`. Lint: `npx eslint .`.
After changes, run type check, lint and build.

## Key files

- `src/config/funnel.ts`: **all settings and copy** (video ID, unlock time, Calendly URLs, phone/WhatsApp,
  testimonials, FAQ, legal links, Meta Pixel ID, GTM/GA4 ID, `META_CAPI_ENABLED`).
- `src/components/funnel/useVimeoWatchTime.ts`: player + watch rules. `watched` = seconds of natural playback
  (timeupdate delta 0–1.5s) and drives the unlock; `maxWatched` = furthest point reached; seeks past it are clamped,
  and a `seeked` safety net snaps back. Progress is saved in localStorage key `bda_training_progress_<videoId>`
  for `RESUME_DAYS`. Speed 0.5x–2x allowed (remembered in `bda_training_speed`); hidden if the Vimeo plan forbids it.
- `src/components/funnel/TrainingVideoPlayer.tsx`: custom control bar (play/pause, locked seek bar with hover time
  and no-entry marker, time, mute, speed menu, fullscreen), keyboard (Space, ←, → up to maxWatched), touch.
  Vimeo is embedded with `controls: false` (needs a paid Vimeo plan; on free plans an overlay blocks native controls).
- `src/lib/attribution.ts`: site-wide UTM / click-ID capture ("ad clicks win" for 30 days), appended to the booking URL.
- `src/lib/funnel-tracking.ts`: dataLayer events, Pixel/GTM loader, in-app browser detection, vCard, WhatsApp link.
- `src/lib/booking.functions.ts`: Meta Conversions API server-function **stub** (TODO).
- `src/routes/thank-you-call.tsx`: reads Calendly redirect params; fires Pixel `Schedule` + dataLayer
  `booking_confirmed` once per `invitee_uuid` with `eventID = "mtg_" + invitee_uuid`; strips PII from the URL.

## Current state / TODO before going live

Temporary **test** settings in `src/config/funnel.ts`:
- `VIMEO_VIDEO_ID = "59785024"` (Sintel, 14:48 public test video), so the 10-minute unlock can be tested.
- `BOOKING_URL = "/thank-you-call"` (skips Calendly). Must become the real Calendly event URL, otherwise visitors
  see "Your call is confirmed" without booking.

Still placeholders: phone / WhatsApp numbers, testimonials, "As featured in", FAQ answers, legal links (`#`),
Meta Pixel ID, GTM/GA4 ID. Meta CAPI not implemented.

To go live: fill the config, deploy (subdomain to be decided, e.g. training.<domain>), then in Calendly set
"Redirect to external site" → `https://<funnel-domain>/thank-you-call` with "Pass event details" on.

## Known limits (explained to the user)

The lock is browser-side: progress is per browser/profile (no login). It can be bypassed only by opening the
booking/thank-you URL directly or by editing localStorage in dev tools. Server-side verification would need a
database; not built.
