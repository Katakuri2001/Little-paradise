"use client";
import { Clock } from "lucide-react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { TRACKS } from "@/lib/demo-data";
import Artwork from "@/components/ui/Artwork";

export default function Recent() {
  const history = useLibraryStore((s) => s.history);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const items = history.map((h) => ({ ...h, track: TRACKS.find((t) => t.id === h.trackId) })).filter((x) => x.track);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="font-display text-3xl font-bold">Recently Played</h1>
      {items.length === 0 ? (
        <div className="text-center text-muted py-16">
          <Clock size={40} className="mx-auto mb-3 opacity-50" />
          Nothing played yet.
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((it: any, i: number) => (
            <div key={i} onClick={() => playTrack(it.track, TRACKS)} className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer">
              <Artwork seed={it.track.artworkSeed} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.track.title}</div>
                <div className="text-xs text-muted truncate">{it.track.artist}</div>
              </div>
              <span className="text-xs text-muted">{new Date(it.playedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
