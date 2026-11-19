import { expect, test } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import LyricsFullscreen from "@/components/lyrics/LyricsFullscreen";

test("renders fullscreen lyrics view with track info", () => {
  const html = renderToString(
    React.createElement(LyricsFullscreen, {
      track: {
        id: "t1",
        title: "Welcome to Paradise",
        artist: "Aurora Vale",
        album: "Midnight Paradise",
        duration: 372.7,
        audioUrl: "/audio/track1.mp3",
        artworkSeed: 1,
        genre: "Dream Pop",
      },
    }),
  );
  expect(html).toContain("Welcome to Paradise");
  expect(html).toContain("Aurora Vale");
});
