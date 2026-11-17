import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type Player from "@vimeo/player";
import { trackEvent } from "@/lib/funnel-tracking";

type SavedProgress = {
  /** Seconds of real (non-skipped) watching — drives the booking unlock. */
  watched: number;
  /** Furthest point in the video reached by normal playback. Seeking past it is blocked. */
  maxWatched: number;
  /** Last playback position, for resuming. */
  position: number;
  /** Last save time (ms since epoch). */
  ts: number;
  unlocked?: boolean;
  /** Progress milestones (25/50/75) already reported. */
  milestones?: number[];
};

/** Max timeupdate gap that still counts as normal playback (Vimeo fires ~every 250ms). */
const MAX_NATURAL_DELTA = 1.5;
/** Tolerance before the seeked safety net snaps the viewer back. */
const SEEK_TOLERANCE = 1;
const SAVE_EVERY_SECONDS = 5;
const MILESTONES = [25, 50, 75] as const;

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const RATE_KEY = "bda_training_speed";

function loadRate(): number {
  try {
    const r = Number(window.localStorage.getItem(RATE_KEY));
    return (PLAYBACK_RATES as readonly number[]).includes(r) ? r : 1;
  } catch {
    return 1;
  }
}

function load(key: string, resumeDays: number): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedProgress>;
    if (!data.ts || Date.now() - data.ts > resumeDays * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(key);
      return null;
    }
    const position = data.position ?? 0;
    return {
      watched: data.watched ?? 0,
      // Older saves had no maxWatched: treat the saved position as reached.
      maxWatched: Math.max(data.maxWatched ?? 0, position),
      position,
      ts: data.ts,
      unlocked: data.unlocked,
      milestones: data.milestones ?? [],
    };
  } catch {
    return null;
  }
}

function save(key: string, data: SavedProgress) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage blocked — progress just won't persist */
  }
}

type Options = {
  videoId: string;
  hash?: string;
  unlockSeconds: number;
  resumeDays: number;
};

export type VimeoWatchTime = ReturnType<typeof useVimeoWatchTime>;

/**
 * Mounts a Vimeo player (native controls off) into `containerRef` and enforces the training rules:
 *  - `watched` counts only seconds of natural playback (seeks never count).
 *  - `maxWatched` is the furthest point reached by natural playback; seeking beyond it is
 *    refused by `seek()` and undone by the "seeked" safety net (covers native controls,
 *    e.g. on Vimeo plans where controls=0 is ignored, or iOS native fullscreen).
 *  - Speed can be changed to one of PLAYBACK_RATES (the choice is remembered). The unlock counts
 *    video seconds, so at 2x it unlocks in half the real time; skipping is still blocked.
 */
export function useVimeoWatchTime(
  containerRef: RefObject<HTMLDivElement | null>,
  { videoId, hash, unlockSeconds, resumeDays }: Options,
) {
  const [watched, setWatched] = useState(0);
  const [maxWatched, setMaxWatched] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  /** False when the Vimeo account/plan doesn't allow speed changes — the menu is hidden then. */
  const [speedSupported, setSpeedSupported] = useState(true);
  const [started, setStarted] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `bda_training_progress_${videoId}`;
  const playerRef = useRef<Player | null>(null);
  const progressRef = useRef<SavedProgress>({ watched: 0, maxWatched: 0, position: 0, ts: 0 });
  /** Baseline for measuring natural playback; reset on every seek so jumps never count. */
  const lastSecondsRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !videoId) return;

    let player: Player | null = null;
    let cancelled = false;
    let lastSavedWatched = 0;
    let videoDuration = 0;
    let playTracked = false;

    const saved = load(storageKey, resumeDays);
    if (saved) {
      progressRef.current = saved;
      lastSavedWatched = saved.watched;
      setWatched(saved.watched);
      setMaxWatched(saved.maxWatched);
      setCurrentTime(saved.position);
      if (saved.watched > 0 || saved.position > 0) setResumed(true);
    } else {
      progressRef.current = {
        watched: 0,
        maxWatched: 0,
        position: 0,
        ts: Date.now(),
        milestones: [],
      };
    }

    const persist = () => {
      progressRef.current.ts = Date.now();
      save(storageKey, progressRef.current);
      lastSavedWatched = progressRef.current.watched;
    };

    const checkThresholds = () => {
      const p = progressRef.current;
      if (!p.unlocked && p.watched >= unlockSeconds) {
        p.unlocked = true;
        trackEvent("booking_unlocked", {
          video_id: videoId,
          watched_seconds: Math.round(p.watched),
        });
        persist();
      }
      if (videoDuration > 0) {
        const pct = (p.watched / videoDuration) * 100;
        for (const m of MILESTONES) {
          if (pct >= m && !p.milestones?.includes(m)) {
            p.milestones = [...(p.milestones ?? []), m];
            trackEvent(`training_progress_${m}`, { video_id: videoId });
            persist();
          }
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };

    (async () => {
      try {
        const { default: VimeoPlayer } = await import("@vimeo/player");
        if (cancelled) return;

        player = new VimeoPlayer(el, {
          ...(hash ? { url: `https://vimeo.com/${videoId}/${hash}` } : { id: Number(videoId) }),
          controls: false, // needs a paid Vimeo plan; ignored otherwise (safety net below still applies)
          keyboard: false,
          speed: true, // enables the playback-rate API (Vimeo hides its own menu when controls=0)
          pip: false,
          playsinline: true,
          dnt: true,
          title: false,
          byline: false,
          portrait: false,
        });
        playerRef.current = player;

        player.on("timeupdate", (data: { seconds: number; duration: number }) => {
          if (data.duration) {
            videoDuration = data.duration;
            setDuration(data.duration);
          }
          const p = progressRef.current;
          const last = lastSecondsRef.current;
          if (last !== null) {
            const delta = data.seconds - last;
            if (delta > 0 && delta <= MAX_NATURAL_DELTA) {
              p.watched += delta;
              setWatched(p.watched);
              // Only extend the frontier when playing on from inside the watched region.
              if (data.seconds > p.maxWatched && last <= p.maxWatched + MAX_NATURAL_DELTA) {
                p.maxWatched = data.seconds;
                setMaxWatched(data.seconds);
              }
              checkThresholds();
            }
          }
          lastSecondsRef.current = data.seconds;
          p.position = data.seconds;
          setCurrentTime(data.seconds);
          if (p.watched - lastSavedWatched >= SAVE_EVERY_SECONDS) persist();
        });

        player.on("seeking", (data: { seconds: number }) => {
          lastSecondsRef.current = data.seconds;
        });
        player.on("seeked", (data: { seconds: number }) => {
          const p = progressRef.current;
          // Safety net: any seek past the watched frontier (native controls, iOS fullscreen…)
          // is pulled back to maxWatched.
          if (data.seconds > p.maxWatched + SEEK_TOLERANCE) {
            lastSecondsRef.current = p.maxWatched;
            setCurrentTime(p.maxWatched);
            player?.setCurrentTime(p.maxWatched).catch(() => undefined);
            return;
          }
          lastSecondsRef.current = data.seconds;
          p.position = data.seconds;
          setCurrentTime(data.seconds);
        });

        player.on("playbackratechange", (data: { playbackRate: number }) => {
          // Keep speed within the allowed list (e.g. if changed from Vimeo's own UI).
          if ((PLAYBACK_RATES as readonly number[]).includes(data.playbackRate)) {
            setPlaybackRateState(data.playbackRate);
          } else {
            player?.setPlaybackRate(1).catch(() => undefined);
          }
        });
        player.on("volumechange", () => {
          player
            ?.getMuted()
            .then((m) => setMuted(m))
            .catch(() => undefined);
        });

        player.on("play", () => {
          setPlaying(true);
          setStarted(true);
          if (!playTracked) {
            playTracked = true;
            trackEvent("training_play", { video_id: videoId });
          }
        });
        player.on("pause", () => {
          setPlaying(false);
          persist();
        });
        player.on("ended", () => {
          setPlaying(false);
          progressRef.current.position = 0;
          persist();
        });

        await player.ready();
        if (cancelled) return;
        videoDuration = await player.getDuration().catch(() => 0);
        setDuration(videoDuration);
        setMuted(await player.getMuted().catch(() => false));
        const savedRate = loadRate();
        try {
          await player.setPlaybackRate(savedRate);
          setPlaybackRateState(savedRate);
        } catch {
          setSpeedSupported(false);
        }

        const resumeAt = progressRef.current.position;
        if (resumeAt > 5 && (!videoDuration || resumeAt < videoDuration - 5)) {
          lastSecondsRef.current = resumeAt;
          await player.setCurrentTime(resumeAt).catch(() => undefined);
        }
        setReady(true);
        checkThresholds();
      } catch (e) {
        console.error("Vimeo player failed to load", e);
        if (!cancelled) setError("The video couldn't load. Please refresh the page.");
      }
    })();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persist);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", persist);
      persist();
      playerRef.current = null;
      player?.destroy().catch(() => undefined);
    };
  }, [containerRef, videoId, hash, unlockSeconds, resumeDays, storageKey]);

  // ------------------------------------------------------------- Controls

  const play = useCallback(async () => {
    try {
      await playerRef.current?.play();
      return true;
    } catch {
      return false; // e.g. browser blocked play without a direct gesture in the iframe
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    if (await player.getPaused().catch(() => true)) await play();
    else await player.pause().catch(() => undefined);
  }, [play]);

  /** Seek, clamped to [0, maxWatched]. Returns the time actually sought to. */
  const seek = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return 0;
    const target = Math.max(0, Math.min(seconds, progressRef.current.maxWatched));
    lastSecondsRef.current = target;
    progressRef.current.position = target;
    setCurrentTime(target);
    player.setCurrentTime(target).catch(() => undefined);
    return target;
  }, []);

  const toggleMute = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    const next = !(await player.getMuted().catch(() => false));
    await player.setMuted(next).catch(() => undefined);
    setMuted(next);
  }, []);

  const setPlaybackRate = useCallback(async (rate: number) => {
    const player = playerRef.current;
    if (!player || !(PLAYBACK_RATES as readonly number[]).includes(rate)) return;
    try {
      await player.setPlaybackRate(rate);
      setPlaybackRateState(rate);
      try {
        window.localStorage.setItem(RATE_KEY, String(rate));
      } catch {
        /* ignore */
      }
    } catch {
      setSpeedSupported(false);
    }
  }, []);

  /** Vimeo's own fullscreen — fallback where element fullscreen isn't supported (iOS). */
  const nativeFullscreen = useCallback(() => {
    playerRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  return {
    watched,
    unlocked: watched >= unlockSeconds,
    maxWatched,
    currentTime,
    duration,
    playing,
    muted,
    playbackRate,
    speedSupported,
    started,
    resumed,
    ready,
    error,
    play,
    togglePlay,
    seek,
    toggleMute,
    nativeFullscreen,
    setPlaybackRate,
  };
}
