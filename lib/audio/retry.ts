export type RetryCallbacks = {
  onRetry: () => void;
  onGiveUp: () => void;
};

export function createRetryPolicy({
  maxRetries = 3,
  baseDelayMs = 1000,
}: { maxRetries?: number; baseDelayMs?: number } = {}) {
  let retries = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const schedule = (onRetry: RetryCallbacks["onRetry"], onGiveUp: RetryCallbacks["onGiveUp"]) => {
    if (timer) clearTimeout(timer);
    retries += 1;
    if (retries <= maxRetries) {
      timer = setTimeout(() => {
        onRetry();
      }, baseDelayMs * retries);
    } else {
      retries = 0;
      onGiveUp();
    }
  };

  const reset = () => {
    retries = 0;
    if (timer) clearTimeout(timer);
  };

  return { schedule, reset };
}
