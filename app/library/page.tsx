"use client";
import Link from "next/link";
import { Heart, ListMusic, User, Clock, Upload, Music2 } from "lucide-react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { TRACKS } from "@/lib/demo-data";

export default function Library() {
  const { favorites, playlists, history } = useLibraryStore();
  const recentTracks = history.slice(0, 6).map((h) => TRACKS.find((t) => t.id === h.trackId)).filter(Boolean) as any[];

  const sections = [
    { title: "Liked Songs", count: favorites.length, icon: Heart, href: "/favorites", desc: "Your favorite tracks" },
    { title: "Playlists", count: playlists.length, icon: ListMusic, href: "/playlists", desc: "Your collections" },
    { title: "Followed Artists", count: useLibraryStore.getState().followedArtists.length, icon: User, href: "/explore", desc: "Artists you follow" },
    { title: "Saved Albums", count: useLibraryStore.getState().savedAlbums.length, icon: Music2, href: "/explore", desc: "Albums you saved" },
    { title: "Recently Played", count: history.length, icon: Clock, href: "/recent", desc: "Your listening history" },
    { title: "Uploaded Music", count: 0, icon: Upload, href: "/settings", desc: "Your uploads" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-muted mt-1">Your music, your way — all in one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.title} href={s.href} className="glass-raised p-5 flex items-center gap-4 group transition-transform duration-150 ease-out-custom hover:scale-[1.01]">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-150 ease-out-custom">
                <Icon size={22} className="text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-muted mt-0.5">{s.desc}</div>
              </div>
              <div className="text-2xl font-display font-bold text-muted">{s.count}</div>
            </Link>
          );
        })}
      </div>

      {recentTracks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Recently Played</h2>
            <Link href="/recent" className="text-xs text-accent hover:text-accent/90 flex items-center gap-1">
              View all <span className="text-sm">→</span>
            </Link>
          </div>
          <div className="space-y-1">
            {recentTracks.map((t: any) => (
              <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors duration-150 ease-out-custom">
                <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white/80">{t.title[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted truncate">{t.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
