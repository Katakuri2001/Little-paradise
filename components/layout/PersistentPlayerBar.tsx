"use client";
import Link from "next/link";
import { Loader2, Maximize2, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, List, Heart } from "lucide-react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { seekAudio, formatTime } from "@/lib/utils";
import Artwork from "@/components/ui/Artwork";

export default function PersistentPlayerBar({ onQueueToggle }: { onQueueToggle?: () => void }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
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

  if (!currentTrack) return null;

  const cycleRepeat = () => {
    const m = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    setRepeatMode(m);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    usePlayerStore.getState().setCurrentTime(t);
    seekAudio(t);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:left-64">
      <div className="glass border-t border-white/10 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-3">
          {/* Left: track info */}
          <div className="flex items-center gap-3 min-w-0 w-1/3">
            <Artwork seed={currentTrack.artworkSeed} size={44} spinning={isPlaying} />
            <div className="min-w-0 hidden sm:block">
              <div className="text-sm font-medium truncate">{currentTrack.title}</div>
              <div className="text-xs text-muted truncate">{currentTrack.artist}</div>
            </div>
            <button onClick={() => toggleFavorite(currentTrack.id)} className="p-1.5 text-muted hover:text-white" aria-label="Toggle favorite" aria-pressed={isFav}>
              <Heart size={16} className={isFav ? "fill-accent text-accent" : ""} />
            </button>
          </div>

          {/* Center: controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setShuffle(!shuffle)} className={`p-1.5 rounded-lg ${shuffle?"text-accent":"text-muted hover:text-white"}`} aria-pressed={shuffle} aria-label="Toggle shuffle"><Shuffle size={16}/></button>
              <button onClick={prev} className="p-1.5 text-muted hover:text-white" aria-label="Previous track"><SkipBack size={18}/></button>
              <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition" aria-label={isPlaying ? "Pause" : "Play"}>
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16}/> : <Play size={16} className="ml-0.5"/>}
              </button>
              <button onClick={next} className="p-1.5 text-muted hover:text-white" aria-label="Next track"><SkipForward size={18}/></button>
              <button onClick={cycleRepeat} className={`p-1.5 rounded-lg ${repeatMode!=="off"?"text-accent":"text-muted hover:text-white"}`} aria-label="Cycle repeat" aria-pressed={repeatMode !== "off"}>
                {repeatMode==="one" ? <Repeat1 size={16}/> : <Repeat size={16}/>}
              </button>
            </div>
            <div className="w-full max-w-xl flex items-center gap-2">
              <span className="text-[10px] text-muted tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
              <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                onChange={onSeek}
                className="flex-1 h-1 accent-violet-400 cursor-pointer" />
              <span className="text-[10px] text-muted tabular-nums w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: volume + queue + fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2 w-1/3 justify-end">
            <button onClick={() => setMuted(!muted)} className="p-1.5 text-muted hover:text-white hidden sm:block" aria-label="Toggle mute">
              {muted || volume === 0 ? <VolumeX size={16}/> : <Volume2 size={16}/>}
            </button>
            <input type="range" min={0} max={1} step={0.01} value={muted?0:volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 h-1 accent-violet-400 cursor-pointer hidden sm:block" />
            <button onClick={onQueueToggle} className="p-1.5 text-muted hover:text-white" aria-label="Open queue"><List size={16}/></button>
            <Link href="/player" className="p-1.5 text-muted hover:text-white hidden sm:block"><Maximize2 size={16}/></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
