import { expect, test } from "vitest";
import React from "react";
import AudioVisualizer from "@/components/player/AudioVisualizer";

test("creates element when enabled and no analyser", () => {
  const element = React.createElement(AudioVisualizer, { enabled: true });
  expect(element.type).toBe(AudioVisualizer);
  expect(element.props.enabled).toBe(true);
});

test("creates element when disabled", () => {
  const element = React.createElement(AudioVisualizer, { enabled: false });
  expect(element.type).toBe(AudioVisualizer);
  expect(element.props.enabled).toBe(false);
});

test("creates element when analyser is null", () => {
  const element = React.createElement(AudioVisualizer, { analyser: null, enabled: true });
  expect(element.type).toBe(AudioVisualizer);
  expect(element.props.analyser).toBeNull();
});
