import { useSyncExternalStore } from 'react';

type WorldClockListener = () => void;

let worldClockTimeMs = 0;
const listeners = new Set<WorldClockListener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getWorldClockTime() {
  return worldClockTimeMs;
}

export function setWorldClockTime(nextWorldClockTimeMs: number) {
  if (worldClockTimeMs === nextWorldClockTimeMs) {
    return;
  }

  worldClockTimeMs = nextWorldClockTimeMs;
  emitChange();
}

export function subscribeToWorldClock(listener: WorldClockListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWorldClockTime() {
  return useSyncExternalStore(
    subscribeToWorldClock,
    getWorldClockTime,
    getWorldClockTime,
  );
}
