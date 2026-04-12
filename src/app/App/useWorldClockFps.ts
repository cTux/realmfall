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
  lastDisplayedWorldMinuteRef: MutableRefObject<number>;
}

export function useWorldClockFps({
  initialWorldTimeMs,
  worldTimeMsRef,
  worldTimeTickRef,
  frameCountRef,
  lastFpsSampleRef,
  lastDisplayedWorldMinuteRef,
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

      const displayedWorldMinute = Math.floor(
        getWorldTimeMinutesFromTimestamp(worldTimeMsRef.current),
      );
      if (displayedWorldMinute !== lastDisplayedWorldMinuteRef.current) {
        lastDisplayedWorldMinuteRef.current = displayedWorldMinute;
        setWorldTimeMs(worldTimeMsRef.current);
      }

      if (lastFpsSampleRef.current === 0) {
        lastFpsSampleRef.current = timestamp;
      }

      const elapsed = timestamp - lastFpsSampleRef.current;
      if (elapsed >= 250) {
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
    lastDisplayedWorldMinuteRef,
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
