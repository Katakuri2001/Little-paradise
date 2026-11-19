"use client";
import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { TRACKS } from "@/lib/demo-data";
import LyricsView from "@/components/lyrics/LyricsView";
import LyricsFullscreen from "@/components/lyrics/LyricsFullscreen";
import Artwork from "@/components/ui/Artwork";

export default function LyricsPage() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const preferences = useLibraryStore((s) => s.preferences);
  const setPreferences = useLibraryStore((s) => s.setPreferences);
  const [immersive, setImmersive] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold">Lyrics</h1>
        <div className="flex gap-2">
          <button onClick={() => setImmersive(!immersive)} className="glass px-3 py-1.5 rounded-full text-xs hover:bg-white/10">
            {immersive ? "Compact" : "Immersive"}
          </button>
          <select value={preferences.lyricsTheme} onChange={(e) => {
            setPreferences({ lyricsTheme: e.target.value as "default" | "minimal" | "highlight" | "karaoke" });
          }} className="glass px-2 py-1 rounded text-xs text-sm">
            <option value="default">Default</option>
            <option value="minimal">Minimal</option>
            <option value="highlight">Highlight</option>
            <option value="karaoke">Karaoke</option>
          </select>
          {currentTrack && (
            <button onClick={() => setFullscreen(true)} className="glass px-3 py-1.5 rounded-full text-xs hover:bg-white/10 flex items-center gap-1">
              <Maximize2 size={12} /> Fullscreen
            </button>
          )}
        </div>
      </div>

      {!currentTrack ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-muted">Select a track to view lyrics</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
            {TRACKS.slice(0, 6).map((t) => (
              <button key={t.id} onClick={() => playTrack(t, TRACKS)} className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 text-left">
                <Artwork seed={t.artworkSeed} size={36} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted truncate">{t.artist}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 grid lg:grid-cols-[320px_1fr] gap-6 min-h-0">
          <div className="hidden lg:flex flex-col items-center justify-center glass rounded-2xl p-6">
            <Artwork seed={currentTrack.artworkSeed} size={200} spinning={usePlayerStore.getState().isPlaying} />
            <div className="mt-4 text-center">
              <div className="font-display font-bold text-lg">{currentTrack.title}</div>
              <div className="text-sm text-muted">{currentTrack.artist}</div>
              <div className="text-xs text-muted mt-1">{currentTrack.album}</div>
            </div>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <LyricsView compact={!immersive} />
          </div>
        </div>
      )}
      {fullscreen && currentTrack && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={() => setFullscreen(false)} className="p-2 rounded-full glass text-white hover:bg-white/20" aria-label="Close fullscreen">
              <X size={20} />
            </button>
          </div>
          <LyricsFullscreen track={currentTrack} />
        </div>
      )}
    </div>
  );
}
