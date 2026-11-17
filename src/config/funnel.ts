/**
 * Training-funnel configuration.
 *
 * Every value used by /free-training and /thank-you-call lives here.
 * Anything marked TODO is a placeholder — replace it with the real value
 * before sending traffic to the funnel.
 */

import staava from "@/assets/clients/staava.png";
import bluespaceHealthcare from "@/assets/clients/bluespace-healthcare.png";
import bharatIct from "@/assets/clients/bharat-ict.png";
import ebcc from "@/assets/clients/ebcc.png";
import naksAssociates from "@/assets/clients/naks-associates.png";
import tataDigital from "@/assets/clients/tata-digital.png";
import iferp from "@/assets/clients/iferp.png";
import pritikaMoney from "@/assets/clients/pritika-money.png";
import pinkAndBlue from "@/assets/clients/pink-and-blue.png";
import finanzaPersonel from "@/assets/clients/finanza-personel.png";

export type FunnelTestimonial = {
  quote: string;
  name: string;
  role: string;
  /** Optional result line shown as a highlight, e.g. "3x faster reporting". */
  result?: string;
};

export type FunnelFaq = { q: string; a: string };

export const FUNNEL = {
  // ---------------------------------------------------------------- Video
  /** TODO: Vimeo video ID (the number in vimeo.com/123456789). TEST VIDEO: "Sintel" (14:48, CC-BY Blender Foundation) — replace with the real training. */
  VIMEO_VIDEO_ID: "59785024",
  /** Optional privacy hash for unlisted videos (the part after the ID in vimeo.com/123456789/abcdef1234). */
  VIMEO_HASH: "",

  /** Seconds of real watching required before the booking button unlocks. Set to 10 while testing. */
  UNLOCK_SECONDS: 600,
  /** How long saved watch progress is kept in the visitor's browser. */
  RESUME_DAYS: 30,

  // -------------------------------------------------------------- Booking
  /**
   * Where "Book my call" goes. Saved UTM / click-ID params are appended automatically.
   * TEMPORARY: points straight to the thank-you page. Before sending real traffic, replace with
   * the Calendly event URL (e.g. "https://calendly.com/<account>/<event>") and set Calendly's
   * redirect to /thank-you-call with "pass event details" on.
   */
  BOOKING_URL: "/thank-you-call",
  /** TODO: Calendly reschedule link (or the event URL if you don't have a dedicated one). */
  RESCHEDULE_URL: "https://calendly.com/bda-technologies/strategy-call",

  // ------------------------------------------------------- Contact / vCard
  /** TODO: WhatsApp number in international format, digits only (no +, spaces or dashes). */
  WHATSAPP_NUMBER: "918929465115",
  WHATSAPP_MESSAGE: "Hi BDA team, I just booked my strategy call. Confirming I'll be available.",
  /** Name shown on the saved contact card. */
  TEAM_DISPLAY_NAME: "BDA Technologies Team",
  TEAM_ORGANISATION: "BDA Technologies",
  /** TODO: Phone number the team calls from, in +<country><number> format. */
  TEAM_PHONE: "+918929465115",
  TEAM_EMAIL: "hello@bdatechnologies.com",
  TEAM_WEBSITE: "https://bdatechnologies.com",

  // ---------------------------------------------------------------- Copy
  TRAINING_EYEBROW: "Free training · BDA Technologies",
  TRAINING_HEADLINE: "Why service businesses stall at ₹5 Cr — and how to break through",
  TRAINING_SUBHEADLINE:
    "Watch the full training. Your free strategy call unlocks once you've seen the key parts — so we spend the call on your business, not the basics.",

  THANK_YOU_HEADLINE: "Your call is confirmed",
  THANK_YOU_SUBHEADLINE: "We will call you on the number you booked with.",

  // ----------------------------------------------------- Social proof
  /** TODO: Replace with real, approved client testimonials. */
  TESTIMONIALS: [
    {
      quote:
        "Placeholder testimonial. Replace with a real client quote about the result they got after working with BDA.",
      name: "Client Name",
      role: "Founder, Company",
      result: "Result headline",
    },
    {
      quote:
        "Placeholder testimonial. Replace with a real client quote about how the call or system changed their operations.",
      name: "Client Name",
      role: "CEO, Company",
      result: "Result headline",
    },
    {
      quote:
        "Placeholder testimonial. Replace with a real client quote — keep it short, specific and outcome-focused.",
      name: "Client Name",
      role: "Director, Company",
      result: "Result headline",
    },
  ] satisfies FunnelTestimonial[],

  /** Client logos for the "Trusted by" grid (same files as the main website's logo marquee). */
  TRUSTED_BY: [
    { name: "Staava", logo: staava },
    { name: "Bluespace Healthcare", logo: bluespaceHealthcare },
    { name: "Bharat ICT", logo: bharatIct },
    { name: "EBCC", logo: ebcc },
    { name: "Naks & Associates", logo: naksAssociates },
    { name: "Tata Digital", logo: tataDigital },
    { name: "IFERP", logo: iferp },
    { name: "Pritika Money", logo: pritikaMoney },
    { name: "Pink & Blue Symbiotic Living", logo: pinkAndBlue },
    { name: "Finanza Personel", logo: finanzaPersonel },
  ] as { name: string; logo: string }[],

  /** TODO: Review and edit the FAQ answers. */
  FAQ: [
    {
      q: "Is the call really free?",
      a: "Yes. The strategy call is free and there is no obligation to buy anything. If we're not a fit, we'll tell you.",
    },
    {
      q: "Who will call me?",
      a: "A senior member of the BDA Technologies team will call you on the number you booked with, at the time you picked.",
    },
    {
      q: "How long is the call?",
      a: "Around 30 minutes. Please be somewhere quiet where you can talk openly about your business.",
    },
    {
      q: "What should I prepare?",
      a: "Know your rough monthly revenue, team size and the biggest bottleneck in your operations right now. That's enough.",
    },
    {
      q: "What if I need to reschedule?",
      a: "Use the reschedule link on this page or in your confirmation email. Please reschedule rather than miss the call.",
    },
  ] satisfies FunnelFaq[],

  // ---------------------------------------------------------- Footer
  /** TODO: Point these at the real legal pages once they exist. */
  LEGAL_LINKS: [
    { label: "Terms", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Disclaimer", href: "#" },
  ],
  DISCLAIMER_TEXT:
    "This site is not a part of Facebook, Google or YouTube, and is not endorsed by them in any way. Results vary and depend on many factors; we make no guarantee of specific outcomes.",

  // -------------------------------------------------------- Tracking
  /** TODO: Meta Pixel ID (numbers only). Empty = pixel not loaded. */
  META_PIXEL_ID: "",
  /** TODO: Google Tag Manager container ID ("GTM-XXXX") or GA4 measurement ID ("G-XXXX"). Empty = not loaded. */
  GOOGLE_TAG_ID: "",
  /** Turn on once the Meta Conversions API server function is implemented (src/lib/booking.functions.ts). */
  META_CAPI_ENABLED: false,
} as const;
