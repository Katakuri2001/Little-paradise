import { expect, test, vi, beforeEach, afterEach } from "vitest";

// Mock Web Audio API before importing the module
class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  connect = vi.fn();
  disconnect = vi.fn();
  getByteFrequencyData = vi.fn((data: Uint8Array) => {
    for (let i = 0; i < data.length; i++) data[i] = 0;
  });
}

class MockMediaElementAudioSourceNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioContext {
  createAnalyser = vi.fn(() => new MockAnalyserNode());
  createMediaElementSource = vi.fn(() => new MockMediaElementAudioSourceNode());
  destination = {};
  close = vi.fn().mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.stubGlobal("window", { AudioContext: MockAudioContext, webkitAudioContext: MockAudioContext });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

import { createAnalyser, getFrequencyData } from "@/lib/audio/analyser";

test("creates analyser from audio element", () => {
  const audio = {} as any;
  const result = createAnalyser(audio);
  expect(result.analyser).toBeInstanceOf(MockAnalyserNode);
  expect(result.source).toBeInstanceOf(MockMediaElementAudioSourceNode);
  expect(typeof result.destroy).toBe("function");
  result.destroy();
});

test("getFrequencyData returns Uint8Array", () => {
  const audio = {} as any;
  const { analyser, destroy } = createAnalyser(audio);
  const data = getFrequencyData(analyser);
  expect(data).toBeInstanceOf(Uint8Array);
  expect(data.length).toBe(1024);
  destroy();
});
