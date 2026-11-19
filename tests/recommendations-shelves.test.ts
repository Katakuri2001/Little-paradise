import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { getDailyMix, getDiscoverWeekly, getSimilarTracks } from "@/lib/recommendations/shelves";
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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

test("Daily Mix is cached per day — same result within a day", () => {
  const tracks = [baseTrack({ id: "a" }), baseTrack({ id: "b" })];
  const userState: Parameters<typeof getDailyMix>[1] = {
    favorites: new Set<string>(["a"]),
    history: [],
    skipped: new Set<string>(),
    favoriteGenres: [],
    favoriteMoods: [],
    currentTrackId: undefined,
  };
  const r1 = getDailyMix(tracks, userState);
  const r2 = getDailyMix(tracks, userState);
  expect(r1).toEqual(r2);
});

test("Daily Mix invalidates on a new day", () => {
  const tracks = [baseTrack({ id: "a" })];
  const userState: Parameters<typeof getDailyMix>[1] = {
    favorites: new Set<string>(["a"]),
    history: [],
    skipped: new Set<string>(),
    favoriteGenres: [],
    favoriteMoods: [],
    currentTrackId: undefined,
  };
  getDailyMix(tracks, userState);
  vi.setSystemTime(new Date("2026-01-16T12:00:00Z")); // next day
  const r2 = getDailyMix(tracks, userState);
  expect(r2.length).toBeGreaterThan(0);
});

test("Discover Weekly excludes recently played tracks", () => {
  const tracks = [
    baseTrack({ id: "played", genre: "Dream Pop" }),
    baseTrack({ id: "unplayed", genre: "Dream Pop" }),
  ];
  const userState: Parameters<typeof getDiscoverWeekly>[1] = {
    favorites: new Set<string>(),
    history: [{ trackId: "played", playedAt: new Date().toISOString(), listenedDuration: 100 }],
    skipped: new Set<string>(),
    favoriteGenres: ["Dream Pop"],
    favoriteMoods: [],
    currentTrackId: undefined,
  };
  const result = getDiscoverWeekly(tracks, userState);
  expect(result.map((r) => r.trackId)).not.toContain("played");
  expect(result.map((r) => r.trackId)).toContain("unplayed");
});

test("Similar tracks match genre or artist", () => {
  const tracks = [
    baseTrack({ id: "t1", genre: "Dream Pop", artist: "Current Artist" }),
    baseTrack({ id: "same-genre", genre: "Dream Pop", artist: "Other Artist" }),
    baseTrack({ id: "diff-genre", genre: "Electronic", artist: "Current Artist" }),
    baseTrack({ id: "diff-both", genre: "Electronic", artist: "Other Artist" }),
  ];
  const result = getSimilarTracks("t1", tracks, {
    favorites: new Set<string>(),
    history: [],
    skipped: new Set<string>(),
    favoriteGenres: [],
    favoriteMoods: [],
    currentTrackId: undefined,
  });
  const ids = result.map((r) => r.trackId);
  expect(ids).toContain("same-genre");
  expect(ids).toContain("diff-genre");
  expect(ids).not.toContain("diff-both");
});
