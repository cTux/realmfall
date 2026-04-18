import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  type SetStateAction,
  type MutableRefObject,
} from 'react';
import { getWorldTimeMinutesFromTimestamp } from '../../ui/world/timeOfDay';
import { setWorldClockTime } from './worldClockStore';

interface UseWorldClockFpsOptions {
  initialWorldTimeMs: number;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
  onWorldMinuteChange?: (worldTimeMinutes: number) => void;
  onWorldSecondChange?: () => void;
}

export function useWorldClockFps({
  initialWorldTimeMs,
  worldTimeMsRef,
  worldTimeTickRef,
  lastDisplayedWorldSecondRef,
  onWorldMinuteChange,
  onWorldSecondChange,
}: UseWorldClockFpsOptions) {
  const lastWorldTimeMinutesRef = useRef(
    getWorldTimeMinutesFromTimestamp(initialWorldTimeMs),
  );
  const syncWorldTime = useEffectEvent((nextWorldTimeMs: number) => {
    const nextWorldTimeMinutes =
      getWorldTimeMinutesFromTimestamp(nextWorldTimeMs);
    setWorldClockTime(nextWorldTimeMs);
    onWorldSecondChange?.();
    if (nextWorldTimeMinutes !== lastWorldTimeMinutesRef.current) {
      lastWorldTimeMinutesRef.current = nextWorldTimeMinutes;
      onWorldMinuteChange?.(nextWorldTimeMinutes);
    }
  });

  useEffect(() => {
    let frameId = 0;
    let running = false;
    setWorldClockTime(initialWorldTimeMs);

    const updateHud = (timestamp: number) => {
      if (!running) {
        return;
      }

      const lastTick = worldTimeTickRef.current;
      if (lastTick != null) {
        worldTimeMsRef.current += timestamp - lastTick;
      }
      worldTimeTickRef.current = timestamp;

      const displayedWorldSecond = Math.floor(worldTimeMsRef.current / 1000);
      if (displayedWorldSecond !== lastDisplayedWorldSecondRef.current) {
        lastDisplayedWorldSecondRef.current = displayedWorldSecond;
        syncWorldTime(worldTimeMsRef.current);
      }

      frameId = window.requestAnimationFrame(updateHud);
    };

    const stopClock = () => {
      running = false;
      worldTimeTickRef.current = null;

      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const startClock = () => {
      if (running || document.visibilityState === 'hidden') {
        return;
      }

      running = true;
      worldTimeTickRef.current = null;
      frameId = window.requestAnimationFrame(updateHud);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopClock();
        return;
      }

      startClock();
    };

    startClock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      stopClock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    initialWorldTimeMs,
    lastDisplayedWorldSecondRef,
    worldTimeMsRef,
    worldTimeTickRef,
  ]);

  const setWorldTimeMs = useCallback(
    (nextWorldTimeMs: SetStateAction<number>) => {
      const resolvedWorldTimeMs =
        typeof nextWorldTimeMs === 'function'
          ? nextWorldTimeMs(worldTimeMsRef.current)
          : nextWorldTimeMs;
      worldTimeMsRef.current = resolvedWorldTimeMs;
      lastDisplayedWorldSecondRef.current = Math.floor(
        resolvedWorldTimeMs / 1000,
      );
      lastWorldTimeMinutesRef.current =
        getWorldTimeMinutesFromTimestamp(resolvedWorldTimeMs);
      setWorldClockTime(resolvedWorldTimeMs);
    },
    [lastDisplayedWorldSecondRef, worldTimeMsRef],
  );

  return {
    setWorldTimeMs,
  };
}
