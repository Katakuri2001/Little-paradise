"use client";
import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { createRetryPolicy } from "@/lib/audio/retry";

export default function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const crossfadeLength = usePlayerStore((s) => s.crossfadeLength);
  const next = usePlayerStore((s) => s.next);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setLoading = usePlayerStore((s) => s.setLoading);
  const setError = usePlayerStore((s) => s.setError);
  const addToHistory = useLibraryStore((s) => s.addToHistory);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const retryRef = useRef(createRetryPolicy({ maxRetries: 3, baseDelayMs: 1000 }));

  // create audio element + Web Audio gain chain once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    (window as { __lpAudio?: HTMLAudioElement }).__lpAudio = audio;

    // Web Audio context + gain node for crossfade/volume control
    const AudioContextCtor =
      window.AudioContext ??
      ((window as unknown) as {
        webkitAudioContext?: typeof globalThis.AudioContext;
      }).webkitAudioContext;
    if (AudioContextCtor) {
      const ctx = new AudioContextCtor();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = muted ? 0 : volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainRef.current = gain;
    }

    return () => {
      retryRef.current.reset();
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      if (gainRef.current) gainRef.current.gain.cancelScheduledValues(0);
      if (audioCtxRef.current) audioCtxRef.current.close();
      audioCtxRef.current = null;
      gainRef.current = null;
    };
  }, []);

  // load track with crossfade support
  useEffect(() => {
    const audio = audioRef.current;
    const gain = gainRef.current;
    if (!audio || !currentTrack) return;

    setLoading(true);
    setError(null);

    const fade = (target: number, durationMs: number) => {
      if (!gain) return;
      const now = gain.context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(target, now + durationMs / 1000);
    };

    const src = currentTrack.audioUrl || `/api/tracks/${currentTrack.id}/stream`;
    const needsReload = audio.src !== new URL(src, window.location.origin).href;

    if (crossfadeLength > 0 && needsReload) {
      // Fade out, switch source, fade in
      fade(0, crossfadeLength / 2);
      setTimeout(() => {
        if (audioRef.current !== audio) return;
        audio.src = src;
        audio.load();
        fade(muted ? 0 : volume, crossfadeLength / 2);
        setLoading(false);
      }, crossfadeLength / 2);
    } else {
      if (needsReload) {
        audio.src = src;
        audio.load();
      }
      setLoading(false);
    }
    // autoplay handled by play/pause effect
  }, [currentTrack, crossfadeLength, muted, volume, setLoading, setError]);

  // sync media session playback state
  useEffect(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // play/pause
  useEffect(() => {
    const audio = audioRef.current;
    const gain = gainRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      const p = audio.play();
      if (p) p.catch((e: unknown) => setError(e instanceof Error ? e.message : "Playback failed"));
    } else {
      audio.pause();
    }
    if (gain) gain.gain.value = muted ? 0 : volume;
  }, [isPlaying, currentTrack, setError, muted, volume]);


  // volume (via Web Audio gain node)
  useEffect(() => {
    const gain = gainRef.current;
    if (gain) gain.gain.value = muted ? 0 : volume;
  }, [volume, muted]);

  // Media Session API
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !currentTrack) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
    });
    ms.setActionHandler("play", () => usePlayerStore.getState().setPlaying(true));
    ms.setActionHandler("pause", () => usePlayerStore.getState().setPlaying(false));
    ms.setActionHandler("previoustrack", () => usePlayerStore.getState().prev());
    ms.setActionHandler("nexttrack", () => usePlayerStore.getState().next());
    ms.setActionHandler("seekto", (e) => {
      if (e.seekTime != null) {
        const a = (window as { __lpAudio?: HTMLAudioElement }).__lpAudio;
        if (a) { a.currentTime = e.seekTime; usePlayerStore.getState().setCurrentTime(e.seekTime); }
      }
    });
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("previoustrack", null);
      ms.setActionHandler("nexttrack", null);
      ms.setActionHandler("seekto", null);
    };
  }, [currentTrack]);

  // events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => { setDuration(audio.duration || 0); setLoading(false); };
    const onCanPlay = () => setLoading(false);
    const onEnded = () => {
      const st = usePlayerStore.getState();
      if (st.repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      addToHistory(st.currentTrack!.id, audio.duration);
      st.next();
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    // Error recovery with exponential backoff, then skip to next track
    const onError = () => {
      retryRef.current.schedule(
        () => {
          audio.load();
          if (usePlayerStore.getState().isPlaying) audio.play().catch(() => {});
        },
        () => {
          setError("Audio failed to load.");
          setLoading(false);
          usePlayerStore.getState().next();
        },
      );
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    // Smooth time sync for lyrics: requestAnimationFrame loop keeps
    // currentTime in the store aligned with actual audio position at ~60fps,
    // so lyrics highlight stays in sync with the music.
    let rafId: number | null = null;
    const tick = () => {
      if (audioRef.current && usePlayerStore.getState().isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const retry = retryRef.current;
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      retry.reset();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
    };
  }, [setCurrentTime, setDuration, setLoading, setError, addToHistory, next]);

  // BroadcastChannel: pause playback in other tabs when this tab plays
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("little-paradise-player");
    const handleMessage = (e: MessageEvent) => {
      if (e.data === "pause" && isPlaying) {
        usePlayerStore.getState().setPlaying(false);
      }
    };
    bc.addEventListener("message", handleMessage);
    if (isPlaying) {
      bc.postMessage({ type: "pause_others" });
    }
    return () => {
      bc.removeEventListener("message", handleMessage);
      bc.close();
    };
  }, [isPlaying]);

  // seek when currentTime changed externally (from UI drag)
  return null;
}

// helper to seek
export function seekAudio(time: number) {
  const a = (window as { __lpAudio?: HTMLAudioElement }).__lpAudio;
  if (a) a.currentTime = time;
}
