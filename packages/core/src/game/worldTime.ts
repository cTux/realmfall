import { GAME_DAY_DURATION_MS, GAME_DAY_MINUTES } from './config';

export function getWorldTimeMinutesFromTimestamp(timestampMs: number) {
  const normalizedMs =
    ((timestampMs % GAME_DAY_DURATION_MS) + GAME_DAY_DURATION_MS) %
    GAME_DAY_DURATION_MS;
  return (normalizedMs / GAME_DAY_DURATION_MS) * GAME_DAY_MINUTES;
}

export function getWorldDayFromTimestamp(timestampMs: number) {
  return Math.max(1, Math.floor(timestampMs / GAME_DAY_DURATION_MS) + 1);
}
