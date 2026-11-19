import { expect, test } from "vitest";
import { parseLrc, findActiveLineIndex, DEMO_LYRICS } from "@/lib/lyrics/parseLrc";

test("parses inline word tags <mm:ss.xx>word", () => {
  const out = parseLrc("[00:01.00] <00:01.50>hello <00:02.00>world");
  expect(out[0].text).toBe("hello world");
  expect(out[0].words).toEqual([
    { time: 1.5, word: "hello" },
    { time: 2.0, word: "world" },
  ]);
});

test("existing LRC without word tags still parses (backward compat)", () => {
  const out = parseLrc("[00:01.00] hello\n[00:02.50] world");
  expect(out).toEqual([
    { time: 1, text: "hello" },
    { time: 2.5, text: "world" },
  ]);
  expect(out[0].words).toBeUndefined();
});

test("applies offset to word times", () => {
  const out = parseLrc("[00:01.00] <00:01.50>hi", 0.5);
  expect(out[0].time).toBe(1.5);
  expect(out[0].words![0].time).toBe(2.0);
});
