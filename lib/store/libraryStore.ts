import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Playlist, User, Preferences } from "../types";
import { PLAYLISTS } from "../demo-data";

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
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  followArtist: (id: string) => void;
  unfollowArtist: (id: string) => void;
  saveAlbum: (id: string) => void;
  unsaveAlbum: (id: string) => void;
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => Playlist | undefined;
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

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setUser: (u) => set({ user: u, isAuthenticated: !!u }),

      toggleFavorite: (trackId) =>
        set((s) => ({
          favorites: s.favorites.includes(trackId)
            ? s.favorites.filter((id) => id !== trackId)
            : [...s.favorites, trackId],
        })),
      isFavorite: (trackId) => get().favorites.includes(trackId),

      followArtist: (id) => set((s) => ({ followedArtists: [...Array.from(new Set([...s.followedArtists, id]))] })),
      unfollowArtist: (id) => set((s) => ({ followedArtists: s.followedArtists.filter((x) => x !== id) })),
      saveAlbum: (id) => set((s) => ({ savedAlbums: [...Array.from(new Set([...s.savedAlbums, id]))] })),
      unsaveAlbum: (id) => set((s) => ({ savedAlbums: s.savedAlbums.filter((x) => x !== id) })),

      createPlaylist: (name, description = "") => {
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
        return pl;
      },
      deletePlaylist: (id) => {
        let removed: Playlist | undefined;
        set((s) => {
          removed = s.playlists.find((p) => p.id === id);
          return { playlists: s.playlists.filter((p) => p.id !== id) };
        });
        return removed;
      },
      restorePlaylist: (p) => set((s) => ({ playlists: [p, ...s.playlists.filter((x) => x.id !== p.id)] })),
      renamePlaylist: (id, name) =>
        set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)) })),
      addToPlaylist: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.trackIds.includes(trackId)
              ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      removeFromPlaylist: (playlistId, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId), updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      reorderPlaylist: (playlistId, from, to) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const arr = [...p.trackIds];
            const [item] = arr.splice(from, 1);
            arr.splice(to, 0, item);
            return { ...p, trackIds: arr, updatedAt: new Date().toISOString() };
          }),
        })),

      addToHistory: (trackId, listenedDuration) =>
        set((s) => ({
          history: [{ trackId, playedAt: new Date().toISOString(), listenedDuration }, ...s.history].slice(0, 200),
        })),

      setPreferences: (p) => set((s) => ({ preferences: { ...s.preferences, ...p } })),
      addRecentSearch: (q) =>
        set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 10) })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    { name: "little-paradise-library" }
  )
);
