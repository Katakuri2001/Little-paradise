import { expect, test, beforeEach } from "vitest";
import { usePlayerStore } from "@/lib/store/playerStore";

beforeEach(() => {
  usePlayerStore.getState().clearQueue();
});

test("setCrossfade clamps to [0, 30]", () => {
  const { setCrossfade } = usePlayerStore.getState();
  setCrossfade(-5);
  expect(usePlayerStore.getState().crossfadeLength).toBe(0);
  setCrossfade(50);
  expect(usePlayerStore.getState().crossfadeLength).toBe(30);
  setCrossfade(10);
  expect(usePlayerStore.getState().crossfadeLength).toBe(10);
});

test("setSleepTimer starts countdown", () => {
  const { setSleepTimer } = usePlayerStore.getState();
  setSleepTimer(60);
  const s = usePlayerStore.getState();
  expect(s.sleepTimerActive).toBe(true);
  expect(s.sleepTimerRemaining).toBe(60);
});

test("setAudioQuality accepts standard/high/lossless", () => {
  const { setAudioQuality } = usePlayerStore.getState();
  setAudioQuality("high");
  expect(usePlayerStore.getState().audioQuality).toBe("high");
  setAudioQuality("lossless");
  expect(usePlayerStore.getState().audioQuality).toBe("lossless");
  setAudioQuality("standard");
  expect(usePlayerStore.getState().audioQuality).toBe("standard");
});
