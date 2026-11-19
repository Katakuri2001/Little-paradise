"use client";
import { useState, useMemo } from "react";
import { Search as SearchIcon, X, Clock } from "lucide-react";
import { TRACKS, ARTISTS, ALBUMS, PLAYLISTS } from "@/lib/demo-data";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLibraryStore } from "@/lib/store/libraryStore";
import Artwork from "@/components/ui/Artwork";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const playTrack = usePlayerStore((s) => s.playTrack);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useLibraryStore();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    return {
      tracks: TRACKS.filter((t) => t.title.toLowerCase().includes(term) || t.artist.toLowerCase().includes(term) || t.album.toLowerCase().includes(term)),
      artists: ARTISTS.filter((a) => a.name.toLowerCase().includes(term)),
      albums: ALBUMS.filter((a) => a.title.toLowerCase().includes(term) || a.artist.toLowerCase().includes(term)),
      playlists: PLAYLISTS.filter((p) => p.name.toLowerCase().includes(term)),
    };
  }, [q]);

  const submit = () => { if (q.trim()) addRecentSearch(q.trim()); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="font-display text-3xl font-bold">Search</h1>
      <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
        <SearchIcon size={20} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Songs, artists, albums, playlists..." className="flex-1 bg-transparent outline-none text-white placeholder:text-muted" />
        {q && <button onClick={() => setQ("")}><X size={18} className="text-muted" /></button>}
      </div>

      {!results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Recent Searches</h2>
            {recentSearches.length > 0 && <button onClick={clearRecentSearches} className="text-xs text-muted hover:text-white">Clear</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.length === 0 && <div className="text-sm text-muted">No recent searches</div>}
            {recentSearches.map((r) => (
              <button key={r} onClick={() => setQ(r)} className="glass px-3 py-1.5 rounded-full text-sm hover:bg-white/10 flex items-center gap-2">
                <Clock size={12} /> {r}
              </button>
            ))}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold mb-3">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["Pop","Electronic","Acoustic","Indie","Ambient","R&B","Jazz","Lo-Fi"].map((g, i) => (
                <div key={g} className="glass rounded-xl p-4 h-20 flex items-end font-medium hover:bg-white/10 cursor-pointer" style={{ background: `linear-gradient(135deg, hsl(${i*40},60%,30%), hsl(${i*40+60},60%,20%))` }}>{g}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {results.tracks.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3">Songs</h2>
              <div className="space-y-1">
                {results.tracks.map((t) => (
                  <div key={t.id} onClick={() => { playTrack(t, TRACKS); addRecentSearch(q.trim()); }}
                    className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer">
                    <Artwork seed={t.artworkSeed} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted truncate">{t.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {results.artists.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3">Artists</h2>
              <div className="flex gap-4 overflow-x-auto">
                {results.artists.map((a) => (
                  <div key={a.id} className="shrink-0 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 mx-auto flex items-center justify-center">
                      <span className="text-xl font-bold text-white/80">{a.name[0]}</span>
                    </div>
                    <div className="text-sm mt-2">{a.name}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {results.albums.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {results.albums.map((a) => (
                  <div key={a.id} className="glass rounded-xl p-3">
                    <Artwork seed={a.seed} size={0} className="w-full aspect-square mb-2 rounded-lg" />
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted truncate">{a.artist}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {results.playlists.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold mb-3">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {results.playlists.map((p) => (
                  <div key={p.id} className="glass rounded-xl p-3">
                    <Artwork seed={p.seed} size={0} className="w-full aspect-square mb-2 rounded-lg" />
                    <div className="text-sm font-medium truncate">{p.name}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 && results.playlists.length === 0 && (
            <div className="text-center text-muted py-12">No results found for "{q}"</div>
          )}
        </div>
      )}
    </div>
  );
}
