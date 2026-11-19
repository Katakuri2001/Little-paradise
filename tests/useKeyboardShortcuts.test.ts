import { expect, test } from "vitest";

test("useKeyboardShortcuts is exported as a function", async () => {
  const mod = await import("@/lib/hooks/useKeyboardShortcuts");
  expect(typeof mod.useKeyboardShortcuts).toBe("function");
});
