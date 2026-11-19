"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TRACKS, ALBUMS, ARTISTS, MOODS, GENRES } from "@/lib/demo-data";
import { usePlayerStore } from "@/lib/store/playerStore";
import Artwork from "@/components/ui/Artwork";
import { GlassPanel } from "@/components/ui/Glass";

function ExploreInner() {
  const params = useSearchParams();
  const mood = params.get("mood");
  const playTrack = usePlayerStore((s) => s.playTrack);
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="font-display text-3xl font-bold">Explore</h1>
      {mood && (
        <div className="glass rounded-2xl p-4 text-sm text-muted">
          Filtering by mood: <span className="text-white capitalize">{mood}</span>
        </div>
      )}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Trending Tracks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRACKS.map((t, i) => (
            <div key={t.id} onClick={() => playTrack(t, TRACKS)} className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer transition">
              <span className="text-muted text-sm w-6">{i + 1}</span>
              <Artwork seed={t.artworkSeed} size={44} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted truncate">{t.artist} · {t.album}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold mb-4">New Releases</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ALBUMS.map((a) => (
            <GlassPanel key={a.id} className="p-3">
              <Artwork seed={a.seed} size={0} className="w-full aspect-square mb-3 rounded-xl" />
              <div className="font-medium text-sm truncate">{a.title}</div>
              <div className="text-xs text-muted truncate">{a.artist}</div>
            </GlassPanel>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Popular Artists</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
          {ARTISTS.map((a) => (
            <Link key={a.id} href={`/artists/${a.id}`} className="shrink-0 w-32 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white/80">{a.name[0]}</span>
              </div>
              <div className="mt-2 text-sm font-medium truncate">{a.name}</div>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <span key={g} className="glass px-4 py-2 rounded-full text-sm hover:bg-white/10 cursor-pointer">{g}</span>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Mood Collections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MOODS.map((m) => (
            <Link key={m.id} href={`/explore?mood=${m.id}`} className={`relative overflow-hidden rounded-2xl p-4 h-24 bg-gradient-to-br ${m.gradient} hover:scale-[1.02] transition`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative font-display font-bold">{m.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}


export default function Explore() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading...</div>}>
      <ExploreInner />
    </Suspense>
  );
}
