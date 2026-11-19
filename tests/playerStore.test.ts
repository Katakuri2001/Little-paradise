import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "../lib/store/playerStore";
import type { Track } from "../lib/types";

const t = (id: string): Track => ({
  id,
  title: id,
  artist: "a",
  album: "al",
  duration: 10,
  audioUrl: "/x.mp3",
  artworkSeed: 1,
  genre: "g",
});

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue();
  });

  it("playTrack sets queue and current", () => {
    const a = t("a"), b = t("b");
    usePlayerStore.getState().playTrack(a, [a, b]);
    const s = usePlayerStore.getState();
    expect(s.currentTrack?.id).toBe("a");
    expect(s.queue).toHaveLength(2);
    expect(s.isPlaying).toBe(true);
  });

  it("next advances and stops at end when repeat off", () => {
    const a = t("a"), b = t("b");
    usePlayerStore.getState().playTrack(a, [a, b]);
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("b");
    usePlayerStore.getState().next();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it("removeFromQueue adjusts index", () => {
    const a = t("a"), b = t("b"), c = t("c");
    usePlayerStore.getState().playTrack(b, [a, b, c]);
    // queueIndex 1
    usePlayerStore.getState().removeFromQueue(0);
    expect(usePlayerStore.getState().queue.map((x) => x.id)).toEqual(["b", "c"]);
    expect(usePlayerStore.getState().queueIndex).toBe(0);
  });
});