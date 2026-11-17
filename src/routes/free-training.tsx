import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck, History, Lock, PlayCircle } from "lucide-react";
import { FUNNEL } from "@/config/funnel";
import { withAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/funnel-tracking";
import { FunnelLayout } from "@/components/funnel/FunnelLayout";
import { FunnelSteps, type StepState } from "@/components/funnel/FunnelSteps";
import { InAppBrowserNotice } from "@/components/funnel/InAppBrowserNotice";
import { FeaturedIn, FunnelTestimonials } from "@/components/funnel/SocialProof";
import { useVimeoWatchTime } from "@/components/funnel/useVimeoWatchTime";
import { TrainingVideoPlayer } from "@/components/funnel/TrainingVideoPlayer";
import { cn } from "@/lib/utils";

const TITLE = "Free Training — BDA Technologies";
const DESCRIPTION =
  "Watch BDA Technologies' free training, then book a free strategy call for your business.";

export const Route = createFileRoute("/free-training")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { name: "twitter:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: FreeTrainingPage,
});

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const unlockMinutes = Math.max(1, Math.round(FUNNEL.UNLOCK_SECONDS / 60));
const unlockLabel =
  FUNNEL.UNLOCK_SECONDS < 60 ? `${FUNNEL.UNLOCK_SECONDS} sec` : `${unlockMinutes} min`;

function FreeTrainingPage() {
  const playerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  const bookingBase = FUNNEL.BOOKING_URL;
  const [bookingHref, setBookingHref] = useState<string>(bookingBase);

  const video = useVimeoWatchTime(playerRef, {
    videoId: FUNNEL.VIMEO_VIDEO_ID,
    hash: FUNNEL.VIMEO_HASH || undefined,
    unlockSeconds: FUNNEL.UNLOCK_SECONDS,
    resumeDays: FUNNEL.RESUME_DAYS,
  });
  const { watched, unlocked, resumed, error } = video;

  const remaining = Math.max(0, FUNNEL.UNLOCK_SECONDS - watched);
  const pct = Math.min(100, (watched / FUNNEL.UNLOCK_SECONDS) * 100);

  // Attribution is captured by the root layout, which mounts after this page's effects run,
  // so build the href on the next tick and again at click time.
  useEffect(() => {
    const id = window.setTimeout(() => setBookingHref(withAttribution(bookingBase)), 0);
    return () => window.clearTimeout(id);
  }, [bookingBase]);

  // Sticky CTA: show only after unlock, while the main CTA is off-screen.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onBookClick = (e: MouseEvent<HTMLAnchorElement>, placement: string) => {
    const href = withAttribution(bookingBase);
    e.currentTarget.href = href;
    trackEvent("book_click", { placement, watched_seconds: Math.round(watched) });
  };

  const steps: { label: string; state: StepState }[] = [
    { label: "Registered", state: "done" },
    { label: "Watch training", state: unlocked ? "done" : "active" },
    { label: "Book call", state: unlocked ? "active" : "locked" },
  ];

  return (
    <FunnelLayout>
      <section className="bg-mesh pb-12 pt-8 md:pb-16 md:pt-12">
        <div className="mx-auto max-w-4xl px-4">
          <InAppBrowserNotice />

          <FunnelSteps steps={steps} />

          <div className="mt-8 text-center md:mt-10">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              {FUNNEL.TRAINING_EYEBROW}
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-3xl leading-[1.1] tracking-tight text-foreground md:text-5xl">
              {FUNNEL.TRAINING_HEADLINE}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {FUNNEL.TRAINING_SUBHEADLINE}
            </p>
          </div>

          <AnimatePresence>
            {resumed && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-primary"
              >
                <History className="h-4 w-4" />
                Welcome back, your progress is saved
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-foreground shadow-elevated">
            {FUNNEL.VIMEO_VIDEO_ID ? (
              <TrainingVideoPlayer mountRef={playerRef} video={video} />
            ) : (
              <div className="grid aspect-video place-items-center text-background/70">
                <PlayCircle className="h-12 w-12" />
              </div>
            )}
          </div>
          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

          {/* Unlock status + CTA */}
          <div
            ref={ctaRef}
            className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft md:p-7"
          >
            {!unlocked ? (
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    Unlocks after {unlockLabel} of watching
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p
                    className="font-mono text-3xl font-semibold tabular-nums text-foreground"
                    aria-live="polite"
                  >
                    {formatClock(remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-center font-semibold text-primary">
                <CalendarCheck className="h-5 w-5" />
                Unlocked — pick a time for your free call
              </div>
            )}

            <div className="mt-5 flex flex-col items-center">
              {unlocked ? (
                <a
                  href={bookingHref}
                  onClick={(e) => onBookClick(e, "main")}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-glow transition hover:shadow-elevated md:w-auto"
                >
                  Book my call
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-secondary px-8 py-4 text-base font-semibold text-muted-foreground md:w-auto"
                >
                  <Lock className="h-4 w-4" />
                  Watch {unlockLabel} to unlock
                </button>
              )}
              <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">
                {unlocked
                  ? "The call is free, with no obligation."
                  : "Keep watching. This unlocks on its own. The call is free, with no obligation."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeaturedIn />
      <FunnelTestimonials />

      {/* Sticky bottom CTA after unlock */}
      <AnimatePresence>
        {unlocked && !ctaVisible && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-elevated backdrop-blur"
          >
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
              <p className="hidden text-sm font-medium text-foreground sm:block">
                Your free strategy call is unlocked
              </p>
              <a
                href={bookingHref}
                onClick={(e) => onBookClick(e, "sticky")}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow sm:flex-none",
                )}
              >
                Book my call
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FunnelLayout>
  );
}
