import { expect, test } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useRecommendations } from "@/lib/hooks/useRecommendations";

function Harness({ shelf }: { shelf: string }) {
  const { tracks, loading } = useRecommendations(shelf as any);
  return React.createElement(
    "div",
    null,
    React.createElement("span", null, `tracks:${tracks.length}`),
    React.createElement("span", null, `loading:${String(loading)}`),
  );
}

test("useRecommendations returns tracks array and loading flag", () => {
  const html = renderToString(React.createElement(Harness, { shelf: "dailyMix" }));
  expect(html).toContain("tracks:");
  expect(html).toContain("loading:");
});
