import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { createRetryPolicy } from "@/lib/audio/retry";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("retries with exponential backoff then gives up", () => {
  const onRetry = vi.fn();
  const onGiveUp = vi.fn();
  const { schedule } = createRetryPolicy({ maxRetries: 3, baseDelayMs: 1000 });

  schedule(onRetry, onGiveUp); // error #1 -> schedule retry in 1s
  expect(onRetry).not.toHaveBeenCalled();
  expect(onGiveUp).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1000);
  expect(onRetry).toHaveBeenCalledTimes(1);

  schedule(onRetry, onGiveUp); // error #2 -> schedule retry in 2s
  vi.advanceTimersByTime(2000);
  expect(onRetry).toHaveBeenCalledTimes(2);

  schedule(onRetry, onGiveUp); // error #3 -> schedule retry in 3s
  vi.advanceTimersByTime(3000);
  expect(onRetry).toHaveBeenCalledTimes(3);

  schedule(onRetry, onGiveUp); // error #4 -> give up
  expect(onGiveUp).toHaveBeenCalledTimes(1);
  expect(onRetry).toHaveBeenCalledTimes(3);
});

test("reset clears pending timers and retry count", () => {
  const onRetry = vi.fn();
  const onGiveUp = vi.fn();
  const { schedule, reset } = createRetryPolicy({ maxRetries: 3, baseDelayMs: 1000 });

  schedule(onRetry, onGiveUp);
  reset();
  vi.advanceTimersByTime(5000);
  expect(onRetry).not.toHaveBeenCalled();
  expect(onGiveUp).not.toHaveBeenCalled();

  // After reset, retry count starts fresh
  schedule(onRetry, onGiveUp);
  vi.advanceTimersByTime(1000);
  expect(onRetry).toHaveBeenCalledTimes(1);
});
