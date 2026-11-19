"use client";
import { Heart } from "lucide-react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { TRACKS } from "@/lib/demo-data";
import Artwork from "@/components/ui/Artwork";

export default function Favorites() {
  const { favorites, toggleFavorite } = useLibraryStore();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const tracks = favorites.map((id) => TRACKS.find((t) => t.id === id)).filter(Boolean) as any[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="font-display text-3xl font-bold">Favorites</h1>
      {tracks.length === 0 ? (
        <div className="text-center text-muted py-16">
          <Heart size={40} className="mx-auto mb-3 opacity-50" />
          No liked songs yet. Tap the heart on a track to save it.
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((t: any, i: number) => (
            <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10">
              <span className="text-muted text-sm w-6">{i + 1}</span>
              <Artwork seed={t.artworkSeed} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted truncate">{t.artist} · {t.album}</div>
              </div>
              <button onClick={() => playTrack(t, tracks)} className="p-1.5 hover:text-accent"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
              <button onClick={() => toggleFavorite(t.id)} className="p-1.5 text-accent"><Heart size={14} className="fill-accent" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
