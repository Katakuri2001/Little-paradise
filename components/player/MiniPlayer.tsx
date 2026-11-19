"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import Artwork from "@/components/ui/Artwork";

export default function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const isFav = useLibraryStore((s) => (currentTrack ? s.favorites.includes(currentTrack.id) : false));

  const [expanded, setExpanded] = useState(true);

  if (!currentTrack) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        transform: `translateY(${expanded ? 0 : 100}%)`,
        transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <div className="glass rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-transform duration-150 ease-out-custom active:scale-95" onClick={() => setExpanded(true)}>
        {/* Artwork */}
        <div className="relative shrink-0">
          <Artwork seed={currentTrack.artworkSeed} size={44} spinning={isPlaying} />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{currentTrack.title}</div>
          <div className="text-xs text-muted truncate">{currentTrack.artist}</div>
        </div>

        {/* Play/pause button */}
        <button onClick={togglePlay} className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-transform duration-150 ease-out-custom active:scale-95">
          {isPlaying ? <Pause size={18} className="ml-0.5" /> : <Play size={18} className="ml-0.5" />}
        </button>
      </div>
    </motion.div>
  );
}