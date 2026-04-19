import {
  BLOOD_MOON_RESET_START,
  BLOOD_MOON_RISE_END,
  BLOOD_MOON_RISE_START,
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
} from './config';
import { t } from '../i18n';
import { createRng } from './random';
import type { GameState, LogEntry, LogKind, LogRichSegment } from './types';

export function createFreshLogs(seed: string) {
  return createInitialLogs(seed);
}

export function createFreshLogsAtTime(seed: string, worldTimeMs: number) {
  return createInitialLogs(seed, worldTimeMs);
}

export function addLog(
  state: GameState,
  kind: LogKind,
  text: string,
  richText?: LogRichSegment[],
) {
  state.logSequence += 1;
  state.logs = [
    makeLog(state.logSequence, kind, state.turn, text, state.worldTimeMs, richText),
    ...state.logs,
  ].slice(0, 100);
}

export function normalizeWorldMinutes(worldTimeMinutes: number) {
  return (
    ((worldTimeMinutes % GAME_DAY_MINUTES) + GAME_DAY_MINUTES) %
    GAME_DAY_MINUTES
  );
}

export function getDayPhase(worldTimeMinutes: number) {
  return worldTimeMinutes >= BLOOD_MOON_RISE_START ||
    worldTimeMinutes < BLOOD_MOON_RESET_START
    ? 'night'
    : 'day';
}

export function isBloodMoonRiseWindow(worldTimeMinutes: number) {
  return (
    worldTimeMinutes >= BLOOD_MOON_RISE_START &&
    worldTimeMinutes < BLOOD_MOON_RISE_END
  );
}

export function worldTimeMsFromMinutes(
  worldTimeMinutes: number,
  currentWorldTimeMs = 0,
) {
  return (
    getWorldDayIndex(currentWorldTimeMs) * GAME_DAY_DURATION_MS +
    (normalizeWorldMinutes(worldTimeMinutes) / GAME_DAY_MINUTES) *
      GAME_DAY_DURATION_MS
  );
}

export function getWorldDayIndex(worldTimeMs: number) {
  return Math.max(0, Math.floor(worldTimeMs / GAME_DAY_DURATION_MS));
}

function createInitialLogs(seed: string, worldTimeMs = 0): LogEntry[] {
  return [
    makeLog(3, 'motd', 0, t('game.log.initial.motd'), worldTimeMs),
    makeLog(2, 'rumor', 0, rumorForSeed(seed), worldTimeMs),
    makeLog(1, 'system', 0, t('game.log.initial.wake'), worldTimeMs),
  ];
}

function makeLog(
  sequence: number,
  kind: LogKind,
  turn: number,
  text: string,
  worldTimeMs = 0,
  richText?: LogRichSegment[],
): LogEntry {
  return {
    id: `l-${sequence}`,
    kind,
    text: `${formatLogPrefix(worldTimeMs)} ${text}`,
    turn,
    richText,
  };
}

function formatLogPrefix(worldTimeMs: number) {
  const totalMinutes = normalizeWorldMinutes(
    (worldTimeMs / GAME_DAY_DURATION_MS) * GAME_DAY_MINUTES,
  );
  const absoluteDay = getWorldDayIndex(worldTimeMs) + 1;
  const year = Math.floor((absoluteDay - 1) / 365) + 1;
  const day = ((absoluteDay - 1) % 365) + 1;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(totalMinutes % 60)
    .toString()
    .padStart(2, '0');
  return t('game.log.prefix.calendarDateTime', {
    year,
    day,
    hours,
    minutes,
  });
}

function rumorForSeed(seed: string) {
  const rumors = [
    t('game.log.rumor.1'),
    t('game.log.rumor.2'),
    t('game.log.rumor.3'),
    t('game.log.rumor.4'),
    t('game.log.rumor.5'),
    t('game.log.rumor.6'),
    t('game.log.rumor.7'),
    t('game.log.rumor.8'),
    t('game.log.rumor.9'),
    t('game.log.rumor.10'),
    t('game.log.rumor.11'),
    t('game.log.rumor.12'),
  ];
  return (
    rumors[Math.floor(createRng(`${seed}:rumor`)() * rumors.length)] ??
    rumors[0]
  );
}
