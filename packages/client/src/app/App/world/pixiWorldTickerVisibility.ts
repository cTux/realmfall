interface PixiTickerVisibilityTarget {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: EventListener): void;
  removeEventListener(type: 'visibilitychange', listener: EventListener): void;
}

interface PixiTickerVisibilityArgs {
  ticker: {
    start(): void;
    stop(): void;
  };
  renderFrame: () => void;
  renderInvalidationRef: { current: number };
  target?: PixiTickerVisibilityTarget;
}

export function attachPixiWorldTickerVisibilityPause({
  ticker,
  renderFrame,
  renderInvalidationRef,
  target = document,
}: PixiTickerVisibilityArgs) {
  const handleVisibilityChange = () => {
    if (target.visibilityState === 'hidden') {
      ticker.stop();
      return;
    }

    renderInvalidationRef.current += 1;
    ticker.start();
    renderFrame();
  };

  target.addEventListener('visibilitychange', handleVisibilityChange);

  if (target.visibilityState === 'hidden') {
    ticker.stop();
  }

  return () => {
    target.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
