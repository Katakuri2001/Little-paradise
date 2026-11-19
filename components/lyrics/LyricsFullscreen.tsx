"use client";
import React from "react";
import { useEffect } from "react";
import { X, Maximize } from "lucide-react";
import LyricsView from "@/components/lyrics/LyricsView";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import type { Track } from "@/lib/types";

export default function LyricsFullscreen({
  track,
}: {
  track: Track;
}) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setCurrentTrack = usePlayerStore((s) => s.setCurrentTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const preferences = useLibraryStore((s) => s.preferences);

  // Attempt fullscreen on mount - may fail due to browser restrictions
  useEffect(() => {
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {
      // Fullscreen request may be blocked by browser - that's OK
    });
    return () => {
      // Only exit fullscreen if we're actually in fullscreen mode
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    };
  }, []);

  // Initialize playback with this track if nothing playing
  useEffect(() => {
    if (!usePlayerStore.getState().currentTrack) {
      setCurrentTrack(track);
      setQueue([track], 0);
      setPlaying(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => {
            document.exitFullscreen?.();
          }}
          className="p-2 rounded-full glass text-white hover:bg-white/20"
          aria-label="Exit fullscreen"
        >
          <X size={20} />
        </button>
        <button
          onClick={() => {
            document.documentElement.requestFullscreen?.();
          }}
          className="p-2 rounded-full glass text-white hover:bg-white/20"
          aria-label="Toggle fullscreen"
        >
          <Maximize size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 mb-6 flex items-center justify-center shadow-2xl">
          <span className="text-white font-bold text-2xl">
            {track.title.charAt(0)}
          </span>
        </div>
        <div className="text-center text-white mb-8">
          <h1 className="font-display text-3xl font-bold">{track.title}</h1>
          <p className="text-white/70 text-lg">{track.artist}</p>
        </div>

        <div className="w-full max-w-2xl">
          <LyricsView compact={false} theme={preferences.lyricsTheme} />
        </div>
      </div>
    </div>
  );
}
