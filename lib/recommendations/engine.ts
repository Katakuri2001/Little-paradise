import { scoreTrack, type UserState } from "@/lib/recommendations/scoring";
import type { Track } from "@/lib/types";

export type Recommendation = { trackId: string; score: number };

export function getRecommendations(
  tracks: Track[],
  userState: UserState,
  limit = 50,
): Recommendation[] {
  return tracks
    .map((track) => ({ trackId: track.id, score: scoreTrack(track, userState) }))
    .filter(
      ({ trackId }) =>
        trackId !== userState.currentTrackId && !userState.skipped.has(trackId),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
