import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Check, Download, MessageCircle, PhoneCall } from "lucide-react";
import { FUNNEL } from "@/config/funnel";
import { getAttribution } from "@/lib/attribution";
import { sendBookingConversion } from "@/lib/booking.functions";
import { downloadTeamVCard, formatPhone, trackEvent, whatsappUrl } from "@/lib/funnel-tracking";
import { FunnelLayout } from "@/components/funnel/FunnelLayout";
import { FunnelSteps } from "@/components/funnel/FunnelSteps";
import { FunnelFaq, FunnelTestimonials } from "@/components/funnel/SocialProof";

const TITLE = "Your call is confirmed — BDA Technologies";

export const Route = createFileRoute("/thank-you-call")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: "Your strategy call with BDA Technologies is confirmed." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
    ],
  }),
  component: ThankYouCallPage,
});

const PHONE_LIKE = /^\+?[\d\s\-().]{7,20}$/;

/** Read Calendly's redirect params ("pass event details to your redirected page"). */
function readCalendlyParams(search: URLSearchParams) {
  let phone = search.get("text_reminder_number")?.trim() || "";
  if (!phone) {
    for (let i = 1; i <= 15; i++) {
      const v = search.get(`answer_${i}`)?.trim();
      if (v && PHONE_LIKE.test(v) && v.replace(/\D/g, "").length >= 7) {
        phone = v;
        break;
      }
    }
  }
  return {
    inviteeUuid: search.get("invitee_uuid")?.trim() || "",
    email: search.get("invitee_email")?.trim() || "",
    fullName: search.get("invitee_full_name")?.trim() || "",
    phone,
  };
}

const PII_PARAMS = [
  "invitee_email",
  "invitee_full_name",
  "invitee_first_name",
  "invitee_last_name",
  "text_reminder_number",
  ...Array.from({ length: 15 }, (_, i) => `answer_${i + 1}`),
];

function ThankYouCallPage() {
  const sendConversion = useServerFn(sendBookingConversion);

  // Booking tracking — fire once per Calendly invitee.
  useEffect(() => {
    const url = new URL(window.location.href);
    const invitee = readCalendlyParams(url.searchParams);

    // Strip personal data from the address bar so it doesn't leak into analytics / shares.
    const cleaned = new URL(url);
    PII_PARAMS.forEach((p) => cleaned.searchParams.delete(p));
    if (cleaned.href !== url.href) window.history.replaceState(window.history.state, "", cleaned);

    if (!invitee.inviteeUuid) return;

    const dedupeKey = `bda_booking_tracked_${invitee.inviteeUuid}`;
    try {
      if (window.localStorage.getItem(dedupeKey)) return;
      window.localStorage.setItem(dedupeKey, String(Date.now()));
    } catch {
      /* storage blocked — still fire once for this page view */
    }

    const eventId = `mtg_${invitee.inviteeUuid}`;
    const attribution = getAttribution();

    trackEvent("booking_confirmed", {
      event_id: eventId,
      invitee_uuid: invitee.inviteeUuid,
      ...attribution,
    });
    window.fbq?.("track", "Schedule", {}, { eventID: eventId });

    // TODO(meta-capi): implement sendBookingConversion, then set FUNNEL.META_CAPI_ENABLED = true.
    // Uses the same eventId so Meta deduplicates the browser and server events.
    if (FUNNEL.META_CAPI_ENABLED) {
      sendConversion({
        data: {
          eventId,
          email: invitee.email || undefined,
          phone: invitee.phone || undefined,
          fullName: invitee.fullName || undefined,
          fbp: attribution._fbp,
          fbc: attribution._fbc,
          sourceUrl: cleaned.href,
        },
      }).catch((e: unknown) => console.error("Meta CAPI call failed", e));
    }
  }, [sendConversion]);

  return (
    <FunnelLayout>
      <section className="bg-mesh pb-12 pt-8 md:pb-16 md:pt-12">
        <div className="mx-auto max-w-3xl px-4">
          <FunnelSteps
            steps={[
              { label: "Registered", state: "done" },
              { label: "Watch training", state: "done" },
              { label: "Book call", state: "done" },
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 text-center"
          >
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </span>
            <h1 className="mt-6 text-3xl tracking-tight text-foreground md:text-5xl">
              {FUNNEL.THANK_YOU_HEADLINE}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
              {FUNNEL.THANK_YOU_SUBHEADLINE}
            </p>
          </motion.div>

          <div className="mt-10">
            <h2 className="text-center text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Do these now — two things before the call
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <StepCard
                n={1}
                icon={<PhoneCall className="h-5 w-5" />}
                title="Save our number"
                body="So you recognise us when we call and don't miss it."
              >
                <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                  {formatPhone(FUNNEL.TEAM_PHONE)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    downloadTeamVCard();
                    trackEvent("save_contact_click");
                  }}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:shadow-elevated"
                >
                  <Download className="h-4 w-4" />
                  Save to contacts
                </button>
              </StepCard>

              <StepCard
                n={2}
                icon={<MessageCircle className="h-5 w-5" />}
                title="Confirm on WhatsApp"
                body="Send us a quick message so we know you'll be there. We'll share reminders here too."
              >
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_confirm_click")}
                  className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  Confirm on WhatsApp
                </a>
              </StepCard>
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Can't make this time?{" "}
              <a
                href={FUNNEL.RESCHEDULE_URL}
                onClick={() => trackEvent("reschedule_click")}
                className="font-medium text-primary underline underline-offset-4"
              >
                Reschedule
              </a>
            </p>
          </div>
        </div>
      </section>

      <FunnelTestimonials title="You're in good company" />
      <FunnelFaq />
    </FunnelLayout>
  );
}

function StepCard({
  n,
  icon,
  title,
  body,
  children,
}: {
  n: number;
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
          {n}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary">
          {icon}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">{body}</p>
      <div className="mt-auto">{children}</div>
    </div>
  );
}
