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
      <h1 className="font-display text-3xl font-bold">Your Library</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.title} href={s.href} className="glass rounded-2xl p-5 hover:bg-white/10 transition flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <Icon size={22} className="text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-muted">{s.desc}</div>
              </div>
              <div className="text-2xl font-display font-bold text-muted">{s.count}</div>
            </Link>
          );
        })}
      </div>

      {recentTracks.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Recently Played</h2>
          <div className="space-y-1">
            {recentTracks.map((t: any) => (
              <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500" />
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
