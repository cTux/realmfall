import { useEffect, useState } from 'react';

interface UseDeferredWindowLifecycleOptions<TSnapshot> {
  active: boolean;
  snapshot: TSnapshot;
  exitDelayMs?: number;
}

interface DeferredWindowLifecycleState<TSnapshot> {
  mounted: boolean;
  visible: boolean;
  snapshot: TSnapshot;
}

export function useDeferredWindowLifecycle<TSnapshot>({
  active,
  snapshot,
  exitDelayMs = 180,
}: UseDeferredWindowLifecycleOptions<TSnapshot>): DeferredWindowLifecycleState<TSnapshot> {
  const [mounted, setMounted] = useState(active);
  const [visible, setVisible] = useState(active);
  const [retainedSnapshot, setRetainedSnapshot] = useState(snapshot);

  useEffect(() => {
    if (active) {
      setRetainedSnapshot(snapshot);
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), exitDelayMs);
    return () => window.clearTimeout(timeout);
  }, [active, exitDelayMs, snapshot]);

  return {
    mounted,
    visible,
    snapshot: retainedSnapshot,
  };
}
