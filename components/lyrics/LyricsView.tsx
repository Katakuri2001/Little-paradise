"use client";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { parseLrc, findActiveLineIndex, DEMO_LYRICS } from "@/lib/lyrics/parseLrc";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import type { LyricsLine } from "@/lib/types";

export default function LyricsView({
  compact = false,
  theme: themeProp,
}: { compact?: boolean; theme?: "default" | "minimal" | "highlight" | "karaoke" }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const lyricsOffset = useLibraryStore((s) => s.preferences.lyricsOffset);
  const autoScroll = useLibraryStore((s) => s.preferences.lyricsAutoScroll);
  const fontSize = useLibraryStore((s) => s.preferences.lyricsFontSize);
  const prefsTheme = useLibraryStore((s) => s.preferences.lyricsTheme);
  const theme = themeProp ?? prefsTheme;

  const [lines, setLines] = useState<LyricsLine[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const programmaticRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentTrack) { setLines([]); return; }
    const lrc = DEMO_LYRICS[currentTrack.id];
    if (lrc) {
      setLines(parseLrc(lrc, lyricsOffset));
    } else {
      setLines([]);
    }
  }, [currentTrack, lyricsOffset]);

  const activeIndex = findActiveLineIndex(lines, currentTime);

  const scrollToActive = () => {
    if (!activeRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const el = activeRef.current;
    const top = el.offsetTop - container.clientHeight / 3 + el.clientHeight / 2;
    programmaticRef.current = true;
    container.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => { programmaticRef.current = false; }, 600);
  };

  useEffect(() => {
    if (!autoScroll || paused || !activeRef.current || !containerRef.current) return;
    scrollToActive();
  }, [activeIndex, autoScroll, paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      if (programmaticRef.current) return;
      setPaused(true);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => setPaused(false), 4000);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [lines]);

  const sizeClass = fontSize === "sm" ? "text-base" : fontSize === "lg" ? "text-2xl" : "text-xl";
  const themeClass = `lyrics-theme-${theme}`;

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Play a song to see lyrics.
      </div>
    );
  }
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="text-muted">Lyrics aren&apos;t available for this track yet.</div>
        <div className="text-xs text-muted/60 mt-2">Demo track — lyrics for demonstration purposes.</div>
      </div>
    );
  }

  const jumpToCurrent = () => {
    setPaused(false);
    scrollToActive();
  };

  return (
    <div className={`relative h-full ${themeClass}`}>
      {paused && (
        <button onClick={jumpToCurrent}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full glass text-xs hover:bg-white/10">
          Jump to current line
        </button>
      )}
      <div ref={containerRef} className={`h-full overflow-y-auto scrollbar-thin px-4 py-8 space-y-3 ${compact ? "" : ""}`}>
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const distance = activeIndex >= 0 ? Math.abs(i - activeIndex) : 0;
          const blur = isActive ? 0 : Math.min(distance * 0.5, 2);
          const opacity = isActive ? 1 : Math.max(0.25, 1 - distance * 0.12);
          const isKaraoke = theme === "karaoke" && isActive && line.words;

          return (
            <motion.div
              key={i}
              ref={isActive ? activeRef : null}
              initial={false}
              animate={{
                opacity,
                scale: isActive ? 1.05 : 1,
                filter: `blur(${blur}px)`,
              }}
              transition={{ duration: 0.4 }}
              onClick={() => {
                usePlayerStore.getState().setCurrentTime(line.time);
                const a = (window as { __lpAudio?: HTMLAudioElement }).__lpAudio;
                if (a) a.currentTime = line.time;
              }}
              className={`cursor-pointer leading-relaxed ${sizeClass} ${isActive ? "font-semibold" : "font-normal"} ${compact ? "text-center" : ""} ${isKaraoke ? "karaoke-line" : ""}`}
            >
              {isKaraoke && line.words ? (
                <>
                  {line.words!.map((w, wi) => {
                    const words = line.words!;
                    const wIsActive = isActive && wi === words.findIndex((aw) => aw.time <= currentTime && aw.time > (words[wi - 1]?.time ?? 0));
                    return (
                      <span
                        key={wi}
                        className={`cursor-pointer ${wIsActive ? "bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent font-semibold" : "text-white/60"}`}
                        onClick={() => {
                          usePlayerStore.getState().setCurrentTime(w.time);
                          const a = (window as { __lpAudio?: HTMLAudioElement }).__lpAudio;
                          if (a) a.currentTime = w.time;
                        }}
                      >
                        {w.word} {wi < words.length - 1 ? " " : ""}
                      </span>
                    );
                  })}
                </>
              ) : isActive ? (
                <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">{line.text}</span>
              ) : (
                <span className="text-white/80">{line.text}</span>
              )}
              {isActive && line.translation && (
                <div className="text-xs text-muted/60 mt-0.5 italic">{line.translation}</div>
              )}
            </motion.div>
          );
        })}
        <div className="h-32" />
      </div>
    </div>
  );
}
