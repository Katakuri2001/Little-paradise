"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Repeat1, Shuffle, Heart } from "lucide-react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { seekAudio, formatTime } from "@/lib/utils";
import LyricsView from "@/components/lyrics/LyricsView";
import Artwork from "@/components/ui/Artwork";
import AudioVisualizer from "@/components/player/AudioVisualizer";

const BG_GRADIENTS = [
  "from-violet-900 via-[#090B12] to-sky-900",
  "from-indigo-900 via-[#090B12] to-pink-900",
  "from-sky-900 via-[#090B12] to-teal-900",
  "from-rose-900 via-[#090B12] to-amber-900",
  "from-emerald-900 via-[#090B12] to-cyan-900",
  "from-purple-900 via-[#090B12] to-blue-900",
];

export default function FullPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setMuted = usePlayerStore((s) => s.setMuted);
  const setShuffle = usePlayerStore((s) => s.setShuffle);
  const setRepeatMode = usePlayerStore((s) => s.setRepeatMode);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const isFav = useLibraryStore((s) => (currentTrack ? s.favorites.includes(currentTrack.id) : false));

  const [mode, setMode] = useState<"artwork" | "lyrics">("artwork");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const analyserRef = useRef<AnalyserNode | null>(null);

  const bgGradient = currentTrack ? BG_GRADIENTS[(currentTrack.artworkSeed - 1) % BG_GRADIENTS.length] : "from-violet-950 via-[#090B12] to-sky-950";

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = ((clientX / innerWidth) - 0.5) * 12;
    const y = ((clientY / innerHeight) - 0.5) * 12;
    setTilt({ x, y });
  };

  if (!currentTrack) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        No track playing. <Link href="/" className="text-accent ml-2">Go home</Link>
      </div>
    );
  }

  const cycleRepeat = () => setRepeatMode(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off");
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    usePlayerStore.getState().setCurrentTime(t);
    seekAudio(t);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 70% 30%, ${currentTrack.artworkSeed % 2 === 0 ? "rgba(167,139,250,0.3)" : "rgba(139,92,246,0.3)"}, transparent 50%)` }} />

      <div className="relative z-10 p-4 sm:p-8 flex flex-col min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="p-2 glass rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
          <button onClick={() => setMode(mode === "artwork" ? "lyrics" : "artwork")}
            className="px-4 py-2 rounded-full text-sm glass hover:bg-white/10">
            {mode === "artwork" ? "Show Lyrics" : "Show Artwork"}
          </button>
        </div>

        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center justify-center">
            {mode === "artwork" ? (
              <>
                <div className="relative group cursor-pointer" onPointerMove={handlePointerMove} style={{ transform: `rotateX(${tilt.y}deg) rotateY(${-tilt.x}deg)`, transition: "transform 0.3s ease" }}>
                  <motion.div animate={isPlaying ? { rotate: 360 } : {}} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="relative z-10">
                    <Artwork seed={currentTrack.artworkSeed} size={260} />
                    <AudioVisualizer analyser={analyserRef.current} enabled className="absolute inset-0 z-0 opacity-20 pointer-events-none" />
                  </motion.div>
                </div>
                <div className="mt-6 text-center">
                  <div className="font-display text-2xl sm:text-3xl font-bold">{currentTrack.title}</div>
                  <div className="text-muted mt-1">{currentTrack.artist}</div>
                  <div className="text-xs text-muted mt-1">{currentTrack.album}</div>
                </div>
              </>
            ) : (
              <div className="w-full h-[60vh] glass rounded-3xl overflow-hidden">
                <LyricsView />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {mode === "artwork" && (
              <div className="glass rounded-3xl p-6 h-[40vh] overflow-hidden">
                <LyricsView compact />
              </div>
            )}
            <div className="glass rounded-3xl p-6 space-y-4">
              <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                onChange={onSeek} className="w-full h-1 accent-violet-400 cursor-pointer" />
              <div className="flex justify-between text-xs text-muted tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setShuffle(!shuffle)} className={`p-2 ${shuffle ? "text-accent" : "text-muted"}`}><Shuffle size={20}/></button>
                <button onClick={prev} className="p-2 text-muted hover:text-white"><SkipBack size={24}/></button>
                <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition">
                  {isPlaying ? <Pause size={22}/> : <Play size={22} className="ml-1"/>}
                </button>
                <button onClick={next} className="p-2 text-muted hover:text-white"><SkipForward size={24}/></button>
                <button onClick={cycleRepeat} className={`p-2 ${repeatMode !== "off" ? "text-accent" : "text-muted"}`}>
                  {repeatMode === "one" ? <Repeat1 size={20}/> : <Repeat size={20}/>}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => toggleFavorite(currentTrack.id)} className={`p-2 ${isFav ? "text-accent" : "text-muted"}`}>
                  <Heart size={18} className={isFav ? "fill-accent" : ""} />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMuted(!muted)} className="p-2 text-muted"><Volume2 size={18}/></button>
                  <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))} className="w-24 h-1 accent-violet-400 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
