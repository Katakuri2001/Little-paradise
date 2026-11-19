import { expect, test } from "vitest";
import { getRecommendations } from "@/lib/recommendations/engine";
import type { Track } from "@/lib/types";

const baseTrack = (overrides: Partial<Track> = {}): Track =>
  ({
    id: "t1",
    title: "Test Track",
    artist: "Test Artist",
    album: "Test Album",
    duration: 100,
    audioUrl: "/audio/test.mp3",
    artworkSeed: 1,
    genre: "Dream Pop",
    ...overrides,
  } as Track);

test("returns sorted recommendations by score desc", () => {
  const tracks = [baseTrack({ id: "a" }), baseTrack({ id: "b" })];
  const result = getRecommendations(tracks, {
    favorites: new Set(["a"]),
    history: [],
    skipped: new Set(),
    favoriteGenres: [],
    favoriteMoods: [],
  });
  expect(result[0].trackId).toBe("a");
  expect(result[0].score).toBeGreaterThan(result[1].score);
});

test("excludes skipped tracks", () => {
  const tracks = [baseTrack({ id: "a" }), baseTrack({ id: "b" })];
  const result = getRecommendations(tracks, {
    favorites: new Set(),
    history: [],
    skipped: new Set(["a"]),
    favoriteGenres: [],
    favoriteMoods: [],
  });
  expect(result.map((r) => r.trackId)).not.toContain("a");
  expect(result.map((r) => r.trackId)).toContain("b");
});

test("excludes current track", () => {
  const tracks = [baseTrack({ id: "current" }), baseTrack({ id: "other" })];
  const result = getRecommendations(tracks, {
    favorites: new Set(),
    history: [],
    skipped: new Set(),
    favoriteGenres: [],
    favoriteMoods: [],
    currentTrackId: "current",
  });
  expect(result.map((r) => r.trackId)).not.toContain("current");
  expect(result.map((r) => r.trackId)).toContain("other");
});

test("returns empty array when no catalog", () => {
  const result = getRecommendations([], {
    favorites: new Set(),
    history: [],
    skipped: new Set(),
    favoriteGenres: [],
    favoriteMoods: [],
  });
  expect(result).toEqual([]);
});

test("limits results to requested count", () => {
  const tracks = [baseTrack({ id: "a" }), baseTrack({ id: "b" }), baseTrack({ id: "c" })];
  const result = getRecommendations(tracks, {
    favorites: new Set(),
    history: [],
    skipped: new Set(),
    favoriteGenres: [],
    favoriteMoods: [],
  }, 2);
  expect(result).toHaveLength(2);
});
