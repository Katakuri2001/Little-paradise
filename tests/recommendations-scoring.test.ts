import { expect, test } from "vitest";
import { scoreTrack, defaultWeights } from "@/lib/recommendations/scoring";
import type { Track } from "@/lib/types";

const baseTrack = (overrides: Record<string, unknown> = {}) =>
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

const baseUserState = (overrides: Record<string, unknown> = {}) => ({
  favorites: new Set<string>(),
  history: [],
  skipped: new Set<string>(),
  favoriteGenres: [],
  favoriteMoods: [],
  currentTrackId: undefined,
  ...overrides,
});

test("defaultWeights are exported and positive where expected", () => {
  expect(defaultWeights.favorite).toBeGreaterThan(0);
  expect(defaultWeights.recency).toBeGreaterThan(0);
  expect(defaultWeights.skip).toBeLessThan(0);
});

test("favorite track gets positive weight", () => {
  const track = baseTrack();
  const user = baseUserState({ favorites: new Set(["t1"]) });
  const score = scoreTrack(track, user);
  expect(score).toBeGreaterThan(0);
});

test("skipped track gets negative weight", () => {
  const track = baseTrack();
  const user = baseUserState({ skipped: new Set(["t1"]) });
  const score = scoreTrack(track, user);
  expect(score).toBeLessThan(0);
});

test("recently played track gets recency boost", () => {
  const track = baseTrack();
  const recent = baseUserState({
    history: [{ trackId: "t1", playedAt: new Date().toISOString(), listenedDuration: 100 }],
  });
  const old = baseUserState({
    history: [{ trackId: "t1", playedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), listenedDuration: 100 }],
  });
  expect(scoreTrack(track, recent)).toBeGreaterThan(scoreTrack(track, old));
});

test("current track is penalized", () => {
  const track = baseTrack({ id: "current" });
  const user = baseUserState({ currentTrackId: "current" });
  expect(scoreTrack(track, user)).toBeLessThan(scoreTrack(baseTrack({ id: "other" }), user));
});
