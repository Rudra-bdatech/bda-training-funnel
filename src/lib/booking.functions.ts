import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const bookingEventSchema = z.object({
  /** Same ID the browser Pixel used ("mtg_" + Calendly invitee_uuid) so Meta deduplicates. */
  eventId: z.string().min(1).max(200),
  email: z.string().max(255).optional(),
  phone: z.string().max(40).optional(),
  fullName: z.string().max(200).optional(),
  fbp: z.string().max(300).optional(),
  fbc: z.string().max(300).optional(),
  sourceUrl: z.string().max(2000).optional(),
});

export type BookingEventInput = z.infer<typeof bookingEventSchema>;

/**
 * Meta Conversions API — "Schedule" event (server side).
 *
 * TODO(meta-capi): implement before setting FUNNEL.META_CAPI_ENABLED = true.
 *  1. Add secrets META_PIXEL_ID and META_CAPI_ACCESS_TOKEN to the server environment.
 *  2. SHA-256 hash email (lowercased, trimmed), phone (digits only, with country code)
 *     and first/last name, as Meta requires.
 *  3. POST to https://graph.facebook.com/v21.0/{PIXEL_ID}/events?access_token=...
 *     with data: [{ event_name: "Schedule", event_time, event_id: data.eventId,
 *     action_source: "website", event_source_url: data.sourceUrl,
 *     user_data: { em, ph, fn, ln, fbp, fbc, client_ip_address, client_user_agent } }]
 *  4. Read client IP / user agent from the incoming request headers.
 */
export const sendBookingConversion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingEventSchema.parse(data))
  .handler(async ({ data }) => {
    void data;
    return { ok: false as const, skipped: true as const, reason: "Meta CAPI not implemented yet" };
  });
