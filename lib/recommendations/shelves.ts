import { getRecommendations } from "@/lib/recommendations/engine";
import type { Track } from "@/lib/types";
import type { Recommendation } from "@/lib/recommendations/engine";

export type UserState = {
  favorites: Set<string>;
  history: { trackId: string; playedAt: string; listenedDuration: number }[];
  skipped: Set<string>;
  favoriteGenres: string[];
  favoriteMoods: string[];
  currentTrackId?: string;
};

const STORAGE_PREFIX = "lp:recs:";

const todayKey = () => new Date().toDateString();

const storage = typeof localStorage !== "undefined" ? localStorage : null;

export function getDailyMix(tracks: Track[], userState: UserState): Recommendation[] {
  const key = `${STORAGE_PREFIX}daily:${todayKey()}`;
  if (storage) {
    const cached = storage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to recompute
      }
    }
  }
  const result = getRecommendations(tracks, userState, 50);
  if (storage) {
    try {
      storage.setItem(key, JSON.stringify(result));
    } catch {
      // localStorage may be unavailable in some environments
    }
  }
  return result;
}

export function getDiscoverWeekly(tracks: Track[], userState: UserState): Recommendation[] {
  const weekKey = Math.floor(Date.now() / (7 * 24 * 3600 * 1000)).toString();
  const key = `${STORAGE_PREFIX}discover:${weekKey}`;
  if (storage) {
    const cached = storage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to recompute
      }
    }
  }
  // Exclude tracks played in the last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const recentlyPlayedIds = new Set(
    userState.history.filter((h) => new Date(h.playedAt).getTime() > sevenDaysAgo).map((h) => h.trackId),
  );
  const filtered = tracks.filter((t) => !recentlyPlayedIds.has(t.id));
  const result = getRecommendations(filtered, userState, 30);
  if (storage) {
    try {
      storage.setItem(key, JSON.stringify(result));
    } catch {
      // localStorage may be unavailable
    }
  }
  return result;
}

export function getSimilarTracks(
  trackId: string,
  tracks: Track[],
  userState: UserState,
): Recommendation[] {
  const current = tracks.find((t) => t.id === trackId);
  if (!current) return [];

  const similar = tracks.filter(
    (t) =>
      t.id !== trackId &&
      (t.genre === current.genre ||
        (t.artistId && current.artistId && t.artistId === current.artistId) ||
        t.artist === current.artist),
  );
  return getRecommendations(similar, userState, 20);
}
