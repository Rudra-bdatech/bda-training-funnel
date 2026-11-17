import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Lock, PlayCircle } from "lucide-react";
import { FUNNEL } from "@/config/funnel";
import { withAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/funnel-tracking";
import { FunnelLayout } from "@/components/funnel/FunnelLayout";
import { FunnelSteps, type StepState } from "@/components/funnel/FunnelSteps";
import { InAppBrowserNotice } from "@/components/funnel/InAppBrowserNotice";
import { FunnelTestimonials, TrustedBy } from "@/components/funnel/SocialProof";
import { useVimeoWatchTime } from "@/components/funnel/useVimeoWatchTime";
import { TrainingVideoPlayer } from "@/components/funnel/TrainingVideoPlayer";
import { UnlockGateDialog } from "@/components/funnel/UnlockGateDialog";
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
  const { watched, unlocked, error, playing, play } = video;
  const [gateOpen, setGateOpen] = useState(false);

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

  const openGate = () => {
    setGateOpen(true);
    trackEvent("locked_cta_click", { watched_seconds: Math.round(watched) });
  };
  const closeGate = useCallback(() => setGateOpen(false), []);
  const playFromGate = () => {
    if (!playing) void play();
    setGateOpen(false);
    // Delay scroll until after the dialog's overflow:hidden cleanup runs.
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Close the popup if the video unlocks while it is open.
  useEffect(() => {
    if (unlocked) setGateOpen(false);
  }, [unlocked]);

  const steps: { label: string; state: StepState }[] = [
    { label: "Registered", state: "done" },
    { label: "Watch training", state: unlocked ? "done" : "active" },
    { label: "Book call", state: unlocked ? "active" : "locked" },
  ];

  return (
    <FunnelLayout>
      <section className="bg-mesh pb-10 pt-5 md:pb-16 md:pt-12">
        <div className="mx-auto max-w-5xl px-4">
          <InAppBrowserNotice />

          <FunnelSteps steps={steps} />

          <div className="mt-5 text-center md:mt-10">
            <h1 className="mx-auto mt-3 max-w-4xl text-[26px] leading-[1.12] tracking-tight text-foreground sm:text-3xl md:mt-4 md:text-5xl">
              {FUNNEL.TRAINING_HEADLINE}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] text-muted-foreground sm:text-base md:mt-4 md:text-lg">
              {FUNNEL.TRAINING_SUBHEADLINE}
            </p>
          </div>

          {/* Video */}
          <div className="mt-5 overflow-hidden rounded-2xl md:mt-6 md:rounded-3xl border border-border bg-foreground shadow-elevated">
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
            className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft md:mt-6 md:rounded-3xl md:p-7"
          >
            {!unlocked ? (
              // Mobile: compact (lock + title | timer, bar below). Desktop: icon tile, title + bar, big timer.
              <div className="flex items-center gap-4">
                <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-muted-foreground md:grid">
                  <Lock className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground sm:text-sm md:gap-2 md:text-base">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground md:hidden" />
                      <span className="truncate">Unlocks after {unlockLabel} of watching</span>
                    </p>
                    <p
                      className="shrink-0 font-mono text-lg font-semibold tabular-nums text-foreground md:hidden"
                      aria-live="polite"
                    >
                      {formatClock(remaining)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="hidden text-center md:block">
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
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base md:px-8 md:py-4 font-semibold text-primary-foreground shadow-glow transition hover:shadow-elevated md:w-auto"
                >
                  Book my call
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : (
                <button
                  type="button"
                  aria-disabled="true"
                  aria-haspopup="dialog"
                  onClick={openGate}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3.5 text-base md:px-8 md:py-4 font-semibold text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground md:w-auto"
                >
                  <Lock className="h-4 w-4" />
                  Watch {unlockLabel} to unlock
                </button>
              )}
              <p className="mt-3 max-w-2xl text-center text-sm text-balance text-muted-foreground">
                {unlocked
                  ? "The call is free, with no obligation."
                  : "Keep watching. This unlocks on its own. The call is free, with no obligation."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <UnlockGateDialog
        open={gateOpen}
        onClose={closeGate}
        onPlay={playFromGate}
        unlockLabel={unlockLabel}
        remainingLabel={formatClock(remaining)}
        pct={pct}
      />

      <TrustedBy />
      {/* <FunnelTestimonials /> */}

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
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
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
