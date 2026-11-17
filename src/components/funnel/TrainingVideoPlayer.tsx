import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { Ban, Check, Gauge, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAYBACK_RATES, type VimeoWatchTime } from "./useVimeoWatchTime";

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
}

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const KEY_SEEK_SECONDS = 10;

/**
 * Vimeo player with BDA's own always-visible control bar.
 * Viewers can rewind freely but can never move past `maxWatched`.
 */
export function TrainingVideoPlayer({
  mountRef,
  video,
}: {
  mountRef: RefObject<HTMLDivElement | null>;
  video: VimeoWatchTime;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** Set when the browser refused to start playback from our button (iOS): let taps reach Vimeo. */
  const [needsDirectTap, setNeedsDirectTap] = useState(false);

  const { togglePlay, seek, play, currentTime, maxWatched, duration } = video;

  // ---------------------------------------------------------- Fullscreen
  useEffect(() => {
    const onChange = () => {
      const d = document as FullscreenDoc;
      const el = document.fullscreenElement ?? d.webkitFullscreenElement;
      setIsFullscreen(!!el && el === wrapperRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const d = document as FullscreenDoc;
    const el = wrapperRef.current as FullscreenEl | null;
    if (!el) return;
    if (document.fullscreenElement || d.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => undefined);
      else void d.webkitExitFullscreen?.();
      return;
    }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => video.nativeFullscreen());
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else video.nativeFullscreen(); // iPhone: only the video element can go fullscreen
  }, [video]);

  // ------------------------------------------------------------ Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      const inPlayer = !!target && !!wrapperRef.current?.contains(target);
      const onPage = !target || target === document.body;
      if (!inPlayer && !onPage) return; // typing in a field, focused link, etc.

      if (e.key === " " || e.key === "Spacebar") {
        if (target?.closest("button, a")) return; // the focused button handles Space itself
        e.preventDefault();
        void togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(currentTime - KEY_SEEK_SECONDS);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentTime < maxWatched) seek(Math.min(currentTime + KEY_SEEK_SECONDS, maxWatched));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, currentTime, maxWatched]);

  const startPlayback = async () => {
    const ok = await play();
    if (!ok) setNeedsDirectTap(true);
  };

  const showStartButton = video.ready && !video.started && !needsDirectTap;
  const catchClicks = video.started; // after the first play, clicks on the video toggle play/pause

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "group/player flex flex-col bg-black outline-none",
        isFullscreen ? "h-full w-full" : "w-full",
      )}
    >
      <div className={cn("relative w-full", isFullscreen ? "flex-1" : "aspect-video")}>
        <div
          ref={mountRef}
          className="absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
        />

        {/* Click catcher: blocks Vimeo's own UI (if the plan can't hide it) and toggles play. */}
        {catchClicks && (
          <button
            type="button"
            aria-label={video.playing ? "Pause" : "Play"}
            onClick={() => void togglePlay()}
            onDoubleClick={toggleFullscreen}
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            tabIndex={-1}
          />
        )}

        {showStartButton && (
          <button
            type="button"
            onClick={() => void startPlayback()}
            className="absolute inset-0 z-10 grid place-items-center bg-black/30 transition hover:bg-black/20"
            aria-label="Play training"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition group-hover/player:scale-105">
              <Play className="ml-1 h-9 w-9 fill-current" />
            </span>
          </button>
        )}

        {!video.ready && !video.error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {needsDirectTap && !video.started && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center text-sm font-medium text-white drop-shadow">
            Tap the video to start
          </p>
        )}
      </div>

      <ControlBar video={video} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
    </div>
  );
}

function ControlBar({
  video,
  isFullscreen,
  onToggleFullscreen,
}: {
  video: VimeoWatchTime;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const iconBtn =
    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-glow disabled:opacity-40";

  return (
    <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-2 text-white sm:gap-3 sm:px-3">
      <button
        type="button"
        className={iconBtn}
        onClick={() => void video.togglePlay()}
        disabled={!video.ready}
        aria-label={video.playing ? "Pause" : "Play"}
      >
        {video.playing ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        )}
      </button>

      <SeekBar video={video} />

      <span className="shrink-0 font-mono text-xs tabular-nums text-white/85 sm:text-sm">
        {formatClock(video.currentTime)}
        <span className="text-white/40"> / </span>
        {formatClock(video.duration)}
      </span>

      <button
        type="button"
        className={iconBtn}
        onClick={() => void video.toggleMute()}
        disabled={!video.ready}
        aria-label={video.muted ? "Unmute" : "Mute"}
      >
        {video.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {video.speedSupported && <SpeedMenu video={video} />}

      <button
        type="button"
        className={iconBtn}
        onClick={onToggleFullscreen}
        disabled={!video.ready}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>
    </div>
  );
}

/**
 * Three layers: full track (grey) → watched fill up to maxWatched (accent) → playhead.
 * Anything before maxWatched can be clicked / dragged to; anything after is locked.
 */
function SeekBar({ video }: { video: VimeoWatchTime }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; time: number } | null>(null);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const { duration, maxWatched, currentTime, seek } = video;
  const enabled = video.ready && duration > 0;

  const pointToTime = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    return { x, time: rect.width ? (x / rect.width) * duration : 0 };
  };

  // Small tolerance so clicking right at the edge of the watched fill still works.
  const isAllowed = (t: number) => t <= maxWatched + 0.25;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    const p = pointToTime(e.clientX);
    setHover(p);
    if (!isAllowed(p.time)) return; // locked region: do nothing
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragTime(Math.min(p.time, maxWatched));
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const p = pointToTime(e.clientX);
    setHover(p);
    if (draggingRef.current) setDragTime(Math.min(p.time, maxWatched)); // clamp drag to frontier
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>, commit: boolean) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (commit && dragTime !== null) seek(dragTime);
    setDragTime(null);
    if (e.pointerType !== "mouse") setHover(null);
  };

  const pct = (t: number) => (duration > 0 ? Math.min(100, (t / duration) * 100) : 0);
  const shownTime = dragTime ?? currentTime;
  const hoverAllowed = hover ? isAllowed(hover.time) : true;
  const trackWidth = trackRef.current?.clientWidth ?? 0;
  const tooltipLeft = hover ? Math.min(Math.max(hover.x, 22), Math.max(trackWidth - 22, 22)) : 0;

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(shownTime)}
      aria-valuetext={`${formatClock(shownTime)} of ${formatClock(duration)}. Watched up to ${formatClock(maxWatched)}.`}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, true)}
      onPointerCancel={(e) => endDrag(e, false)}
      onPointerLeave={() => {
        if (!draggingRef.current) setHover(null);
      }}
      className={cn(
        "relative flex h-8 min-w-0 flex-1 touch-none select-none items-center",
        !enabled && "opacity-50",
      )}
      style={{
        cursor: !enabled ? "default" : hover && !hoverAllowed ? "not-allowed" : "pointer",
      }}
    >
      {/* 1. full track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-600">
        {/* 2. watched frontier */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary-glow"
          style={{ width: `${pct(maxWatched)}%` }}
        />
      </div>

      {/* 3. playhead */}
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-2 ring-primary-glow transition-transform",
          dragTime !== null && "scale-125",
        )}
        style={{ left: `${pct(shownTime)}%` }}
      />

      {/* hover tooltip + locked marker */}
      {hover && enabled && (
        <>
          <div
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 font-mono text-xs tabular-nums text-white shadow"
            style={{ left: tooltipLeft }}
          >
            {formatClock(dragTime ?? hover.time)}
            {!hoverAllowed && dragTime === null && (
              <span className="ml-1.5 font-sans text-[10px] text-red-300">Not watched yet</span>
            )}
          </div>
          {!hoverAllowed && dragTime === null && (
            <Ban
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-red-600"
              strokeWidth={2.5}
              style={{ left: hover.x }}
              aria-hidden
            />
          )}
        </>
      )}
    </div>
  );
}

/** Playback speed picker. Rendered inside the player (not a portal) so it works in fullscreen. */
function SpeedMenu({ video }: { video: VimeoWatchTime }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = (r: number) => `${r}x`;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!video.ready}
        aria-label={`Playback speed ${label(video.playbackRate)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-9 items-center gap-1 rounded-full px-2 text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-glow disabled:opacity-40",
          open && "bg-white/10",
        )}
      >
        <Gauge className="h-5 w-5" />
        {video.playbackRate !== 1 && (
          <span className="font-mono text-xs tabular-nums">{label(video.playbackRate)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Playback speed"
          className="absolute bottom-full right-0 z-30 mb-2 w-32 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 py-1 text-sm text-white shadow-elevated backdrop-blur"
        >
          {[...PLAYBACK_RATES].reverse().map((r) => {
            const active = r === video.playbackRate;
            return (
              <button
                key={r}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  void video.setPlaybackRate(r);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/10",
                  active && "bg-white/5 font-semibold",
                )}
              >
                <Check className={cn("h-4 w-4", active ? "opacity-100" : "opacity-0")} />
                {r === 1 ? "1x (Normal)" : label(r)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
