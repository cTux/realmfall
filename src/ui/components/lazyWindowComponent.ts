export const WINDOW_IMPORT_RETRY_DELAY_MS = 1000;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

export async function loadRetryingWindowModule<T>(
  loader: () => Promise<T>,
  retryDelayMs = WINDOW_IMPORT_RETRY_DELAY_MS,
): Promise<T> {
  for (;;) {
    try {
      return await loader();
    } catch {
      await wait(retryDelayMs);
    }
  }
}
