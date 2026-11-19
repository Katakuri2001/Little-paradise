"use client";
import { useMemo } from "react";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { TRACKS } from "@/lib/demo-data";
import { getDailyMix, getDiscoverWeekly, getSimilarTracks } from "@/lib/recommendations/shelves";
import type { Track } from "@/lib/types";

type Shelf = "dailyMix" | "discoverWeekly" | "similar" | "followedReleases";

export function useRecommendations(
  shelf: Shelf,
  options: { trackId?: string } = {},
): { tracks: Track[]; loading: boolean } {
  const favorites = useLibraryStore((s) => s.favorites);
  const history = useLibraryStore((s) => s.history);
  const preferences = useLibraryStore((s) => s.preferences);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const userState = {
    favorites: new Set(favorites),
    history,
    skipped: new Set<string>(),
    favoriteGenres: preferences.favoriteGenres,
    favoriteMoods: preferences.favoriteMoods,
    currentTrackId: currentTrack?.id,
  };

  const tracks = useMemo(() => {
    let result: { trackId: string; score: number }[] = [];
    if (shelf === "dailyMix") {
      result = getDailyMix(TRACKS, userState);
    } else if (shelf === "discoverWeekly") {
      result = getDiscoverWeekly(TRACKS, userState);
    } else if (shelf === "similar" && options.trackId) {
      result = getSimilarTracks(options.trackId, TRACKS, userState);
    } else if (shelf === "followedReleases") {
      const followedIds = new Set(useLibraryStore.getState().followedArtists);
      const followedTracks = TRACKS.filter((t) => t.artistId && followedIds.has(t.artistId));
      result = followedTracks.map((t) => ({ trackId: t.id, score: 1 }));
    }
    const trackMap = new Map(TRACKS.map((t) => [t.id, t]));
    return result
      .map((r) => trackMap.get(r.trackId))
      .filter((t): t is Track => t !== undefined);
  }, [shelf, options.trackId, favorites, history, preferences, currentTrack]);

  return { tracks, loading: false };
}
