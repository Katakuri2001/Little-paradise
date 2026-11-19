import { describe, it, expect } from "vitest";
import { parseLrc, findActiveLineIndex } from "../lib/lyrics/parseLrc";

describe("parseLrc", () => {
  it("parses basic LRC", () => {
    const out = parseLrc("[00:01.00] hello\n[00:02.50] world");
    expect(out).toEqual([
      { time: 1, text: "hello" },
      { time: 2.5, text: "world" },
    ]);
  });
  it("applies offset", () => {
    const out = parseLrc("[00:01.00] hi", 0.5);
    expect(out[0].time).toBe(1.5);
  });
  it("sorts out-of-order timestamps", () => {
    const out = parseLrc("[00:02.00] b\n[00:01.00] a");
    expect(out.map((l) => l.text)).toEqual(["a", "b"]);
  });
  it("skips blank text lines", () => {
    const out = parseLrc("[00:01.00] \n[00:02.00] x");
    expect(out).toHaveLength(1);
  });
});

describe("findActiveLineIndex", () => {
  it("returns -1 for empty", () => {
    expect(findActiveLineIndex([], 5)).toBe(-1);
  });
  it("returns correct index", () => {
    const lines = parseLrc("[00:01.00] a\n[00:05.00] b");
    expect(findActiveLineIndex(lines, 3)).toBe(0);
    expect(findActiveLineIndex(lines, 5)).toBe(1);
  });
});