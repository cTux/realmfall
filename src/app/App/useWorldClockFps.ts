import { useEffect, useMemo, useState, type MutableRefObject } from 'react';
import {
  formatWorldDateTime,
  getWorldTimeMinutesFromTimestamp,
} from '../../ui/world/timeOfDay';

interface UseWorldClockFpsOptions {
  initialWorldTimeMs: number;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
  frameCountRef: MutableRefObject<number>;
  lastFpsSampleRef: MutableRefObject<number>;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
}

export function useWorldClockFps({
  initialWorldTimeMs,
  worldTimeMsRef,
  worldTimeTickRef,
  frameCountRef,
  lastFpsSampleRef,
  lastDisplayedWorldSecondRef,
}: UseWorldClockFpsOptions) {
  const [worldTimeMs, setWorldTimeMs] = useState(initialWorldTimeMs);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const updateHud = (timestamp: number) => {
      const lastTick = worldTimeTickRef.current;
      if (lastTick != null) {
        worldTimeMsRef.current += timestamp - lastTick;
      }
      worldTimeTickRef.current = timestamp;

      const displayedWorldSecond = Math.floor(worldTimeMsRef.current / 1000);
      if (displayedWorldSecond !== lastDisplayedWorldSecondRef.current) {
        lastDisplayedWorldSecondRef.current = displayedWorldSecond;
      }

      if (lastFpsSampleRef.current === 0) {
        lastFpsSampleRef.current = timestamp;
      }

      const elapsed = timestamp - lastFpsSampleRef.current;
      if (elapsed >= 1000) {
        setWorldTimeMs(worldTimeMsRef.current);
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFpsSampleRef.current = timestamp;
      }

      frameId = window.requestAnimationFrame(updateHud);
    };

    frameId = window.requestAnimationFrame(updateHud);
    return () => {
      worldTimeTickRef.current = null;
      window.cancelAnimationFrame(frameId);
    };
  }, [
    frameCountRef,
    lastDisplayedWorldSecondRef,
    lastFpsSampleRef,
    worldTimeMsRef,
    worldTimeTickRef,
  ]);

  const worldTimeMinutes = useMemo(
    () => getWorldTimeMinutesFromTimestamp(worldTimeMs),
    [worldTimeMs],
  );
  const worldTimeLabel = useMemo(
    () => formatWorldDateTime(worldTimeMs),
    [worldTimeMs],
  );
  return {
    fps,
    setWorldTimeMs,
    worldTimeLabel,
    worldTimeMinutes,
    worldTimeMs,
  };
}
