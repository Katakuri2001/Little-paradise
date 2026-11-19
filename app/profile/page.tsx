"use client";
import { User, Music2, Heart, ListMusic } from "lucide-react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { TRACKS } from "@/lib/demo-data";
import Artwork from "@/components/ui/Artwork";

export default function Profile() {
  const { user, isAuthenticated, favorites, playlists } = useLibraryStore();
  const displayName = user?.displayName ?? "Guest Listener";
  const username = user?.username ?? "guest";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-4xl font-bold">
          {displayName[0]}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-3xl font-bold">{displayName}</h1>
          <div className="text-muted">@{username}</div>
          <div className="text-xs text-muted mt-1">
            {isAuthenticated ? "Member since " + new Date(user!.createdAt).toLocaleDateString() : "Browsing as guest"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <Heart size={20} className="mx-auto text-accent mb-1" />
          <div className="text-2xl font-display font-bold">{favorites.length}</div>
          <div className="text-xs text-muted">Liked Songs</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <ListMusic size={20} className="mx-auto text-accent mb-1" />
          <div className="text-2xl font-display font-bold">{playlists.length}</div>
          <div className="text-xs text-muted">Playlists</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <Music2 size={20} className="mx-auto text-accent mb-1" />
          <div className="text-2xl font-display font-bold">{TRACKS.length}</div>
          <div className="text-xs text-muted">Tracks Available</div>
        </div>
      </div>

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Favorite Tracks</h2>
        {favorites.length === 0 ? (
          <div className="text-muted text-sm">No favorites yet.</div>
        ) : (
          <div className="space-y-1">
            {favorites.slice(0, 5).map((id) => {
              const t = TRACKS.find((x) => x.id === id);
              if (!t) return null;
              return (
                <div key={id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <Artwork seed={t.artworkSeed} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted truncate">{t.artist}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
