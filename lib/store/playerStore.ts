import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Track, RepeatMode, PlayerState } from "../types";

interface PlayerActions {
  setCurrentTrack: (track: Track | null) => void;
  setPlaying: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  setMuted: (v: boolean) => void;
  setShuffle: (v: boolean) => void;
  setRepeatMode: (m: RepeatMode) => void;
  setQueue: (q: Track[], index?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  moveInQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setCrossfade: (v: number) => void;
  setSleepTimer: (minutes: number) => void;
  tickSleepTimer: () => void;
  setAudioQuality: (q: "standard" | "high" | "lossless") => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  persist(
    (set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeatMode: "off",
  queue: [],
  queueIndex: -1,
  isLoading: false,
  error: null,
  crossfadeLength: 0,
  sleepTimerActive: false,
  sleepTimerRemaining: 0,
  audioQuality: "standard",

  setCrossfade: (v) => set({ crossfadeLength: Math.max(0, Math.min(30, v)) }),
  setSleepTimer: (minutes) => {
    set({ sleepTimerActive: minutes > 0, sleepTimerRemaining: minutes });
  },
  tickSleepTimer: () =>
    set((s) => {
      if (!s.sleepTimerActive || s.sleepTimerRemaining <= 0) {
        return { sleepTimerActive: false, sleepTimerRemaining: 0 };
      }
      return { sleepTimerRemaining: s.sleepTimerRemaining - 1 };
    }),
  setAudioQuality: (q) => set({ audioQuality: q }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setPlaying: (v) => set({ isPlaying: v }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  setMuted: (v) => set({ muted: v }),
  setShuffle: (v) => set({ shuffle: v }),
  setRepeatMode: (m) => set({ repeatMode: m }),
  setQueue: (q, index = 0) => set({ queue: q, queueIndex: index, currentTrack: q[index] ?? null }),
  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),
  removeFromQueue: (index) =>
    set((s) => {
      const q = s.queue.filter((_, i) => i !== index);
      let qi = s.queueIndex;
      if (index < qi) qi -= 1;
      if (qi >= q.length) qi = q.length - 1;
      return { queue: q, queueIndex: qi, currentTrack: q[qi] ?? null };
    }),
  moveInQueue: (from, to) =>
    set((s) => {
      const q = [...s.queue];
      const [item] = q.splice(from, 1);
      q.splice(to, 0, item);
      let qi = s.queueIndex;
      if (qi === from) qi = to;
      else if (from < qi && to >= qi) qi -= 1;
      else if (from > qi && to <= qi) qi += 1;
      return { queue: q, queueIndex: qi };
    }),
  clearQueue: () => set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),

  playTrack: (track, queue) => {
    const q = queue ?? [track];
    const idx = q.findIndex((t) => t.id === track.id);
    set({ queue: q, queueIndex: idx >= 0 ? idx : 0, currentTrack: track, isPlaying: true, currentTime: 0, error: null });
  },
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  next: () => {
    const s = get();
    if (s.queue.length === 0) return;
    let nextIdx = s.queueIndex + 1;
    if (s.shuffle) {
      nextIdx = Math.floor(Math.random() * s.queue.length);
    }
    if (nextIdx >= s.queue.length) {
      if (s.repeatMode === "all") nextIdx = 0;
      else { set({ isPlaying: false }); return; }
    }
    set({ queueIndex: nextIdx, currentTrack: s.queue[nextIdx], isPlaying: true, currentTime: 0 });
  },
  prev: () => {
    const s = get();
    if (s.queue.length === 0) return;
    if (s.currentTime > 3) { set({ currentTime: 0 }); return; }
    let prevIdx = s.queueIndex - 1;
    if (prevIdx < 0) {
      if (s.repeatMode === "all") prevIdx = s.queue.length - 1;
      else prevIdx = 0;
    }
    set({ queueIndex: prevIdx, currentTrack: s.queue[prevIdx], isPlaying: true, currentTime: 0 });
  },
  }),
  {
    name: "little-paradise-player",
    storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
    partialize: (s) => ({
      currentTrack: s.currentTrack,
      currentTime: s.currentTime,
      volume: s.volume,
      muted: s.muted,
      shuffle: s.shuffle,
      repeatMode: s.repeatMode,
      queue: s.queue,
      queueIndex: s.queueIndex,
      crossfadeLength: s.crossfadeLength,
      audioQuality: s.audioQuality,
    }),
  }
  )
);
