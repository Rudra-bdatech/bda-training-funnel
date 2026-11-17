import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called from the click, so the browser treats play() as user-initiated. */
  onPlay: () => void;
  unlockLabel: string;
  remainingLabel: string;
  pct: number;
};

const MOBILE_QUERY = "(max-width: 767px)";

/** True below Tailwind's `md` breakpoint, where the dialog becomes a bottom sheet. */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * Shown when someone clicks the locked "Watch … to unlock" button.
 * Centered dialog on desktop; bottom sheet (slides up, swipe down to close) on mobile.
 */
export function UnlockGateDialog({
  open,
  onClose,
  onPlay,
  unlockLabel,
  remainingLabel,
  pct,
}: Props) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const mobile = useIsMobile();
  const hidden = mobile ? { y: "100%" } : { opacity: 0, y: 16, scale: 0.97 };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const prevFocus = document.activeElement as HTMLElement | null;
    // Hiding the scrollbar widens the page; pad by its width so content doesn't shift right.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbarWidth}px`;
    }
    body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    primaryRef.current?.focus();
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-60 flex items-end justify-center bg-foreground/50 backdrop-blur-[2px] md:items-center md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-gate-title"
            aria-describedby="unlock-gate-desc"
            className="relative w-full rounded-t-3xl bg-card px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-center shadow-elevated md:max-w-md md:rounded-3xl md:p-8"
            initial={hidden}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 380, damping: mobile ? 36 : 30 }}
            drag={mobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle (mobile sheet) */}
            <span
              aria-hidden="true"
              className="mx-auto -mt-2 mb-3 block h-1.5 w-10 rounded-full bg-border md:hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-primary">
              <Lock className="h-6 w-6" />
            </span>

            <h2
              id="unlock-gate-title"
              className="mt-4 text-2xl leading-tight tracking-tight text-foreground"
            >
              Watch for {unlockLabel} to unlock booking
            </h2>
            <p id="unlock-gate-desc" className="mt-2 text-muted-foreground">
              Watch the training video for {unlockLabel} and the Book my call button will unlock on
              its own.
            </p>

            <div className="mt-6 text-left">
              <div className="flex items-end justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Time left to unlock</p>
                <p
                  className="font-mono text-3xl font-semibold tabular-nums text-primary"
                  aria-live="polite"
                >
                  {remainingLabel}
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <button
              ref={primaryRef}
              type="button"
              onClick={onPlay}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-glow transition hover:shadow-elevated"
            >
              Continue watching
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
