"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TRACKS, ALBUMS, ARTISTS, MOODS, GENRES } from "@/lib/demo-data";
import { usePlayerStore } from "@/lib/store/playerStore";
import Artwork from "@/components/ui/Artwork";

function ExploreInner() {
  const params = useSearchParams();
  const mood = params.get("mood");
  const playTrack = usePlayerStore((s) => s.playTrack);
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Explore</h1>
        {mood && (
          <div className="glass-subtle px-3 py-1 rounded-full text-xs text-muted flex items-center gap-1">
            <span className="text-accent">●</span> Filtering by mood: <span className="text-white capitalize">{mood}</span>
          </div>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Trending Tracks</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRACKS.map((t, i) => (
            <div key={t.id} onClick={() => playTrack(t, TRACKS)} className="glass-raised rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition-transform duration-150 ease-out-custom hover:scale-[1.01]">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">New Releases</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ALBUMS.map((a) => (
            <Link key={a.id} href={`/albums/${a.id}`} className="glass-raised p-3 flex flex-col transition-transform duration-150 ease-out-custom hover:scale-[1.01]">
              <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden group">
                <Artwork seed={a.seed} size={0} className="w-full h-full" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-opacity duration-150 ease-out-custom" />
              </div>
              <div className="font-medium text-sm truncate">{a.title}</div>
              <div className="text-xs text-muted truncate">{a.artist}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Popular Artists</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
          {ARTISTS.map((a) => (
            <Link key={a.id} href={`/artists/${a.id}`} className="shrink-0 w-32 text-center group flex flex-col items-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-150 ease-out-custom">
                <span className="text-2xl font-bold text-white/80">{a.name[0]}</span>
              </div>
              <div className="mt-2 text-sm font-medium truncate">{a.name}</div>
              <div className="text-xs text-muted">{(a.followers / 1000).toFixed(0)}K followers</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Genres</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <span key={g} className="glass-subtle px-4 py-2 rounded-full text-xs font-medium hover:bg-white/10 cursor-pointer transition-colors duration-150 ease-out-custom">{g}</span>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Mood Collections</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MOODS.map((m) => (
            <Link key={m.id} href={`/explore?mood=${m.id}`} className={`relative overflow-hidden rounded-2xl p-4 h-24 bg-gradient-to-br ${m.gradient} hover:scale-[1.02] transition-transform duration-150 ease-out-custom group cursor-pointer`}>
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
