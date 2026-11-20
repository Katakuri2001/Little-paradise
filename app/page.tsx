"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { TRACKS, PLAYLISTS, MOODS, ALBUMS, ARTISTS } from "@/lib/demo-data";
import { usePlayerStore } from "@/lib/store/playerStore";
import Artwork from "@/components/ui/Artwork";
import { GlassPanel } from "@/components/ui/Glass";
import { useRecommendations } from "@/lib/hooks/useRecommendations";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [featured] = useState(TRACKS[0]);
  const recent = TRACKS.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-6 sm:p-10 min-h-[400px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-transparent to-sky-900/30" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 w-full">
          <div className="flex-1 space-y-4">
            <div className="text-sm font-medium text-muted">Welcome back</div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
              Welcome to <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">Little Paradise</span>.
            </h1>
            <p className="text-muted max-w-md mt-3">Your little world of music — listen, discover, and feel every lyric in sync.</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => playTrack(featured, TRACKS)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-transform duration-150 ease-out-custom active:scale-95"
              >
                <Play size={16} className="ml-0.5" /> Play Featured
              </button>
              <Link href="/explore" className="flex items-center gap-2 px-5 py-2.5 rounded-full glass hover:bg-white/10 transition-transform duration-150 ease-out-custom">
                Explore <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} className="shrink-0">
            <Artwork seed={featured.artworkSeed} size={180} />
          </motion.div>
        </div>
      </section>

      /* Quick Access */
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Quick Access</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
          {recent.map((t) => (
            <button key={t.id} onClick={() => playTrack(t, TRACKS)}
              className="shrink-0 w-40 text-left group flex flex-col items-center">
              <div className="relative w-full h-40 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-lg overflow-hidden">
                <Artwork seed={t.artworkSeed} size={160} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out-custom bg-black/30 rounded-2xl">
                  <Play size={28} className="text-white" />
                </div>
              </div>
              <div className="mt-2 text-sm font-medium truncate">{t.title}</div>
              <div className="text-xs text-muted truncate">{t.artist}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Made for you */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Made For You</h2>
          <Sparkles size={18} className="text-accent" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Your Daily Mix", desc: "Songs based on your listening", tracks: TRACKS.slice(0, 4) },
            { title: "Songs You Might Love", desc: "Picked for your taste", tracks: [TRACKS[2], TRACKS[4], TRACKS[1]] },
            { title: "Recently Played", desc: "Jump back in", tracks: TRACKS.slice(2, 6) },
          ].map((c, i) => (
            <GlassPanel key={i} className="p-4 hover:bg-white/10 transition-transform duration-150 ease-out-custom cursor-pointer" >
              <div className="flex items-center gap-4">
                <Artwork seed={i + 1} size={64} />
                <div className="min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted">{c.desc}</div>
                  <div className="text-xs text-muted mt-1">{c.tracks.length} tracks</div>
                </div>
              </div>
              <button onClick={() => playTrack(c.tracks[0], c.tracks)} className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 transition-transform duration-150 ease-out-custom active:scale-95">
                <Play size={14}/> Play
              </button>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* Daily Mix */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Daily Mix</h2>
        </div>
        <RecommendationShelf shelf="dailyMix" title="Daily Mix" desc="Based on your listening history and favorites" />
      </section>

      {/* Discover Weekly */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Discover Weekly</h2>
        </div>
        <RecommendationShelf shelf="discoverWeekly" title="Discover Weekly" desc="New picks for you, refreshed weekly" />
      </section>

      {/* Featured playlists */}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Featured Playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PLAYLISTS.map((p) => (
            <Link key={p.id} href={`/playlists/${p.id}`} className="group flex flex-col">
              <GlassPanel className="p-3 hover:bg-white/10 transition-transform duration-150 ease-out-custom group-hover:scale-[1.02]">
                <Artwork seed={p.seed} size={0} className="w-full aspect-square mb-3 rounded-xl" />
                <div className="font-medium text-sm truncate">{p.name}</div>
                <div className="text-xs text-muted truncate">{p.description || "No description"}</div>
                <div className="text-xs text-muted mt-1">{p.trackIds.length} tracks</div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </section>

      {/* Moods */}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Browse by Mood</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {MOODS.map((m) => (
            <Link key={m.id} href={`/explore?mood=${m.id}`} className="relative overflow-hidden rounded-2xl p-4 h-24 bg-gradient-to-br ${m.gradient} hover:scale-[1.02] transition-transform duration-150 ease-out-custom group">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative font-display font-bold">{m.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending artists */}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Popular Artists</h2>
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
    </div>
  );
}

function RecommendationShelf({
  shelf,
  title,
  desc,
}: {
  shelf: "dailyMix" | "discoverWeekly";
  title: string;
  desc: string;
}) {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { tracks, loading } = useRecommendations(shelf);

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton w-40 h-40" />
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-muted">No recommendations yet. Play some tracks to personalize your mix.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() => playTrack(t, tracks)}
            className="shrink-0 w-40 text-left group flex flex-col items-center"
          >
            <div className="relative w-full h-40 group relative">
              <Artwork seed={t.artworkSeed} size={160} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out-custom bg-black/30 rounded-2xl">
                <Play size={28} className="text-white" />
              </div>
            </div>
            <div className="mt-2 text-sm font-medium truncate">{t.title}</div>
            <div className="text-xs text-muted truncate">{t.artist}</div>
          </button>
        ))}
      </div>
    </section>
  );
}