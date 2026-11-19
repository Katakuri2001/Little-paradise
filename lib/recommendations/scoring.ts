import type { Track } from "@/lib/types";

export type UserState = {
  favorites: Set<string>;
  history: { trackId: string; playedAt: string; listenedDuration: number }[];
  skipped: Set<string>;
  favoriteGenres: string[];
  favoriteMoods: string[];
  currentTrackId?: string;
};

export const defaultWeights = {
  favorite: 3.0,
  recency: 2.0,
  genreMatch: 1.0,
  moodMatch: 1.0,
  skip: -2.0,
  frequency: 1.0,
  currentTrack: -1.0,
} as const;

function trackMatchesMood(track: Track, moodId: string): boolean {
  // Simple heuristic: map mood IDs to genre affinities transparently
  const moodGenreMap: Record<string, string[]> = {
    dreamy: ["Dream Pop", "Ambient"],
    latenight: ["Electronic", "Dream Pop"],
    rainy: ["Acoustic", "Indie"],
    heartbreak: ["Indie", "Acoustic"],
    romantic: ["Dream Pop", "R&B"],
    peaceful: ["Ambient", "Acoustic"],
    nostalgic: ["Indie", "Dream Pop"],
    focus: ["Electronic", "Lo-Fi"],
    happy: ["Indie", "Pop"],
    lonely: ["Acoustic", "Indie"],
  };
  return moodGenreMap[moodId]?.includes(track.genre) ?? false;
}

function recencyBoost(playedAt: string): number {
  const ms = Date.now() - new Date(playedAt).getTime();
  const days = ms / (24 * 3600 * 1000);
  if (days < 1) return 1.0;
  if (days < 7) return 0.7;
  if (days < 30) return 0.4;
  return 0.1;
}

export function scoreTrack(track: Track, userState: UserState, weights = defaultWeights): number {
  let score = 0;

  if (userState.favorites.has(track.id)) score += weights.favorite;

  const recentPlay = userState.history.find((h) => h.trackId === track.id);
  if (recentPlay) score += weights.recency * recencyBoost(recentPlay.playedAt);

  if (userState.favoriteGenres.includes(track.genre)) score += weights.genreMatch;

  if (userState.favoriteMoods.some((m) => trackMatchesMood(track, m))) score += weights.moodMatch;

  if (userState.skipped.has(track.id)) score += weights.skip;

  const frequency = Math.min(
    userState.history.filter((h) => h.trackId === track.id).length / 10,
    1.0,
  );
  score += frequency * weights.frequency;

  if (track.id === userState.currentTrackId) score += weights.currentTrack;

  return score;
}
