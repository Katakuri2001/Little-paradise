import { expect, test } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import LyricsShareCard from "@/components/lyrics/LyricsShareCard";

test("renders share card with lines and track title", () => {
  const html = renderToString(
    React.createElement(LyricsShareCard, {
      lines: ["Welcome to your little paradise", "Where the music never fades"],
      track: { title: "Welcome to Paradise", artist: "Aurora Vale" },
      artworkSeed: 1,
    }),
  );
  expect(html).toContain("Welcome to your little paradise");
  expect(html).toContain("Welcome to Paradise");
  expect(html).toContain("Aurora Vale");
});
