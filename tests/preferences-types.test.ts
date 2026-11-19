import { expect, test } from "vitest";
import type { Preferences } from "@/lib/types";

test("Preferences type accepts favoriteGenres and favoriteMoods", () => {
  const prefs: Preferences = {
    theme: "dark",
    accent: "#A78BFA",
    defaultVolume: 0.8,
    autoplay: true,
    crossfade: false,
    rememberPosition: true,
    lyricsAutoScroll: true,
    lyricsFontSize: "md",
    lyricsOffset: 0,
    lyricsMode: "immersive",
    privateProfile: true,
    privatePlaylists: true,
    reducedTransparency: false,
    favoriteGenres: ["Dream Pop", "Electronic"],
    favoriteMoods: ["dreamy", "focus"],
    lyricsTheme: "default",
    sleepTimerMinutes: 0,
    audioQuality: "standard",
    crossfadeLength: 0,
  };

  expect(prefs.favoriteGenres).toContain("Dream Pop");
  expect(prefs.favoriteGenres).toContain("Electronic");
  expect(prefs.favoriteMoods).toContain("dreamy");
  expect(prefs.favoriteMoods).toContain("focus");
});
