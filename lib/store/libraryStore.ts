import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Playlist, User, Preferences } from "../types";
import { PLAYLISTS } from "../demo-data";

async function serverFetch(path: string, init?: RequestInit) {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(path, { credentials: "include", ...init });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function serverPostJson(path: string, body: unknown) {
  return serverFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function serverPatchJson(path: string, body: unknown) {
  return serverFetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function serverDelete(path: string) {
  return serverFetch(path, { method: "DELETE" });
}

const defaultPrefs: Preferences = {
  theme: "dark",
  accent: "#A78BFA",
  defaultVolume: 0.8,
  autoplay: true,
  crossfade: false,
  rememberPosition: true,
  lyricsAutoScroll: true,
  lyricsFontSize: "md",
  lyricsOffset: 0,
  lyricsMode: "immersive",
  privateProfile: true,
  privatePlaylists: true,
  reducedTransparency: false,
  favoriteGenres: [],
  favoriteMoods: [],
  lyricsTheme: "default",
  sleepTimerMinutes: 0,
  audioQuality: "standard",
  crossfadeLength: 0,
};

interface LibraryState {
  user: User | null;
  isAuthenticated: boolean;
  favorites: string[]; // track ids
  followedArtists: string[];
  savedAlbums: string[];
  playlists: Playlist[];
  history: { trackId: string; playedAt: string; listenedDuration: number }[];
  preferences: Preferences;
  recentSearches: string[];

  login: (user: User) => void;
  logout: () => void;
  setUser: (u: User | null) => void;
  syncFromServer: () => Promise<void>;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  followArtist: (id: string) => void;
  unfollowArtist: (id: string) => void;
  saveAlbum: (id: string) => void;
  unsaveAlbum: (id: string) => void;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<Playlist | undefined>;
  restorePlaylist: (p: Playlist) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylist: (playlistId: string, from: number, to: number) => void;
  addToHistory: (trackId: string, listenedDuration: number) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      favorites: [],
      followedArtists: [],
      savedAlbums: [],
      playlists: PLAYLISTS,
      history: [],
      preferences: defaultPrefs,
      recentSearches: [],

      login: async (user) => {
        set({ user, isAuthenticated: true });
        void get().syncFromServer();
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      setUser: (u) => set({ user: u, isAuthenticated: !!u }),

      syncFromServer: async () => {
        // Re-validate auth state from the server session cookie
        const me = await serverFetch("/api/auth/me");
        if (me?.user) {
          set({ user: me.user, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
          return;
        }

        const { user } = get();
        if (!user?.id) return;

        const [favs, playlists, history, prefs, follows, saved, searches] = await Promise.all([
          serverFetch(`/api/me/favorites`),
          serverFetch(`/api/playlists`),
          serverFetch(`/api/me/history`),
          serverFetch(`/api/me/preferences`),
          serverFetch(`/api/social/following/${user.id}`),
          serverFetch(`/api/me/saved-albums`),
          serverFetch(`/api/me/recent-searches`),
        ]);

        if (favs?.favorites) set((s) => ({ favorites: favs.favorites }));
        if (playlists?.playlists) set((s) => ({ playlists: playlists.playlists }));
        if (history?.history) set((s) => ({ history: history.history }));
        if (prefs?.preferences) set((s) => ({ preferences: { ...defaultPrefs, ...prefs.preferences } }));
        if (follows?.following) set((s) => ({ followedArtists: follows.following.map((f: { id: string }) => f.id) }));
        if (saved?.albums) set((s) => ({ savedAlbums: saved.albums }));
        if (searches?.searches) set((s) => ({ recentSearches: searches.searches }));
      },

      toggleFavorite: async (trackId) => {
        const wasFav = get().favorites.includes(trackId);
        // Optimistic update
        set((s) => ({
          favorites: wasFav
            ? s.favorites.filter((id) => id !== trackId)
            : [...s.favorites, trackId],
        }));
        try {
          const ok = wasFav
            ? await serverDelete(`/api/me/favorites/${trackId}`)
            : await serverPostJson(`/api/me/favorites/${trackId}`, {});
          if (!ok) {
            // Revert on server failure
            set((s) => ({
              favorites: wasFav
                ? [...s.favorites, trackId]
                : s.favorites.filter((id) => id !== trackId),
            }));
          }
        } catch {
          // Revert on server failure
          set((s) => ({
            favorites: wasFav
              ? [...s.favorites, trackId]
              : s.favorites.filter((id) => id !== trackId),
          }));
        }
      },
      isFavorite: (trackId) => get().favorites.includes(trackId),

      followArtist: async (id) => {
        set((s) => ({ followedArtists: [...Array.from(new Set([...s.followedArtists, id]))] }));
        try {
          const ok = await serverPostJson(`/api/social/follow/${id}`, {});
          if (!ok) {
            set((s) => ({ followedArtists: s.followedArtists.filter((x) => x !== id) }));
          }
        } catch {
          set((s) => ({ followedArtists: s.followedArtists.filter((x) => x !== id) }));
        }
      },
      unfollowArtist: async (id) => {
        set((s) => ({ followedArtists: s.followedArtists.filter((x) => x !== id) }));
        try {
          const ok = await serverDelete(`/api/social/follow/${id}`);
          if (!ok) {
            set((s) => ({ followedArtists: [...Array.from(new Set([...s.followedArtists, id]))] }));
          }
        } catch {
          set((s) => ({ followedArtists: [...Array.from(new Set([...s.followedArtists, id]))] }));
        }
      },
      saveAlbum: async (id) => {
        set((s) => ({ savedAlbums: [...Array.from(new Set([...s.savedAlbums, id]))] }));
        try {
          const ok = await serverPostJson(`/api/me/saved-albums/${id}`, {});
          if (!ok) {
            set((s) => ({ savedAlbums: s.savedAlbums.filter((x) => x !== id) }));
          }
        } catch {
          set((s) => ({ savedAlbums: s.savedAlbums.filter((x) => x !== id) }));
        }
      },
      unsaveAlbum: async (id) => {
        set((s) => ({ savedAlbums: s.savedAlbums.filter((x) => x !== id) }));
        try {
          const ok = await serverDelete(`/api/me/saved-albums/${id}`);
          if (!ok) {
            set((s) => ({ savedAlbums: [...Array.from(new Set([...s.savedAlbums, id]))] }));
          }
        } catch {
          set((s) => ({ savedAlbums: [...Array.from(new Set([...s.savedAlbums, id]))] }));
        }
      },

      createPlaylist: async (name, description = "") => {
        const pl: Playlist = {
          id: "pl_" + Math.random().toString(36).slice(2, 10),
          name,
          description,
          trackIds: [],
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          seed: Math.floor(Math.random() * 10) + 1,
        };
        set((s) => ({ playlists: [pl, ...s.playlists] }));
        try {
          const ok = await serverPostJson("/api/playlists", { name, description });
          if (!ok) {
            set((s) => ({ playlists: s.playlists.filter((p) => p.id !== pl.id) }));
          }
        } catch {
          set((s) => ({ playlists: s.playlists.filter((p) => p.id !== pl.id) }));
        }
        return pl;
      },
      deletePlaylist: async (id) => {
        let removed: Playlist | undefined;
        set((s) => {
          removed = s.playlists.find((p) => p.id === id);
          return { playlists: s.playlists.filter((p) => p.id !== id) };
        });
        try {
          const ok = await serverDelete(`/api/playlists/${id}`);
          if (!ok && removed) {
            set((s) => ({ playlists: [removed as Playlist, ...s.playlists] }));
          }
        } catch {
          if (removed) {
            set((s) => ({ playlists: [removed as Playlist, ...s.playlists] }));
          }
        }
        return removed;
      },
      restorePlaylist: (p) => set((s) => ({ playlists: [p, ...s.playlists.filter((x) => x.id !== p.id)] })),
      renamePlaylist: async (id, name) => {
        set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)) }));
        try {
          const ok = await serverPatchJson(`/api/playlists/${id}`, { name });
          if (!ok) {
            // Revert handled by next syncFromServer
          }
        } catch {
          // Revert handled by next syncFromServer
        }
      },
      addToPlaylist: async (playlistId, trackId) => {
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.trackIds.includes(trackId)
              ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: new Date().toISOString() }
              : p
          ),
        }));
        try {
          const ok = await serverPostJson(`/api/playlists/${playlistId}/tracks`, { trackId });
          if (!ok) {
            set((s) => ({
              playlists: s.playlists.map((p) =>
                p.id === playlistId
                  ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId), updatedAt: new Date().toISOString() }
                  : p
              ),
            }));
          }
        } catch {
          set((s) => ({
            playlists: s.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId), updatedAt: new Date().toISOString() }
                : p
            ),
          }));
        }
      },
      removeFromPlaylist: async (playlistId, trackId) => {
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId), updatedAt: new Date().toISOString() }
              : p
          ),
        }));
        try {
          const ok = await serverDelete(`/api/playlists/${playlistId}/tracks?trackId=${encodeURIComponent(trackId)}`);
          if (!ok) {
            set((s) => ({
              playlists: s.playlists.map((p) =>
                p.id === playlistId
                  ? {
                      ...p,
                      trackIds: [...p.trackIds, trackId],
                      updatedAt: new Date().toISOString(),
                    }
                  : p
              ),
            }));
          }
        } catch {
          set((s) => ({
            playlists: s.playlists.map((p) =>
              p.id === playlistId
                ? {
                    ...p,
                    trackIds: [...p.trackIds, trackId],
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          }));
        }
      },
      reorderPlaylist: async (playlistId, from, to) => {
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const arr = [...p.trackIds];
            const [item] = arr.splice(from, 1);
            arr.splice(to, 0, item);
            return { ...p, trackIds: arr, updatedAt: new Date().toISOString() };
          }),
        }));
        try {
          const ok = await serverPatchJson(`/api/playlists/${playlistId}/reorder`, { from, to });
          if (!ok) {
            // Revert handled by next syncFromServer
          }
        } catch {
          // Revert handled by next syncFromServer
        }
      },

      addToHistory: async (trackId, listenedDuration) => {
        set((s) => ({
          history: [{ trackId, playedAt: new Date().toISOString(), listenedDuration }, ...s.history].slice(0, 200),
        }));
        try {
          const ok = await serverPostJson("/api/me/history", { trackId, listenedDuration });
          if (!ok) {
            set((s) => ({
              history: s.history.filter((h) => h.trackId !== trackId || h.playedAt !== new Date().toISOString()),
            }));
          }
        } catch {
          set((s) => ({
            history: s.history.filter((h) => h.trackId !== trackId || h.playedAt !== new Date().toISOString()),
          }));
        }
      },

      setPreferences: async (p) => {
        set((s) => ({ preferences: { ...s.preferences, ...p } }));
        try {
          const ok = await serverPatchJson("/api/me/preferences", p);
          if (!ok) {
            // Revert handled by next syncFromServer
          }
        } catch {
          // Revert handled by next syncFromServer
        }
      },
      addRecentSearch: async (q) => {
        set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 10) }));
        try {
          const ok = await serverPostJson("/api/me/recent-searches", { q });
          if (!ok) {
            set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) }));
          }
        } catch {
          set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) }));
        }
      },
      clearRecentSearches: async () => {
        set({ recentSearches: [] });
        try {
          const ok = await serverDelete("/api/me/recent-searches");
          if (!ok) {
            // Revert handled by next syncFromServer
          }
        } catch {
          // Revert handled by next syncFromServer
        }
      },
    }),
    { name: "little-paradise-library" }
  )
);
