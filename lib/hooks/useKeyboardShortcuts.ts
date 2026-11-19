"use client";
import { useEffect, useCallback } from "react";

type KeyHandler = () => void;

export function useKeyboardShortcuts(handlers: Record<string, KeyHandler>): void {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const handler = handlers[key] ?? handlers[e.code.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [handlers],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}
