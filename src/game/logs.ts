import {
  BLOOD_MOON_RESET_START,
  BLOOD_MOON_RISE_END,
  BLOOD_MOON_RISE_START,
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
} from './config';
import { createRng } from './random';
import type { GameState, LogEntry, LogKind } from './types';

export function createFreshLogs(seed: string) {
  return createInitialLogs(seed);
}

export function addLog(state: GameState, kind: LogKind, text: string) {
  state.logSequence += 1;
  state.logs = [
    makeLog(state.logSequence, kind, state.turn, text, state.worldTimeMs),
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

function createInitialLogs(seed: string): LogEntry[] {
  return [
    makeLog(
      3,
      'motd',
      0,
      'MOTD: The Fracture shows no mercy, and neither does an empty pack.',
    ),
    makeLog(2, 'rumor', 0, rumorForSeed(seed)),
    makeLog(
      1,
      'system',
      0,
      'You wake amid the shattered Shards with Aether in your bones.',
    ),
  ];
}

function makeLog(
  sequence: number,
  kind: LogKind,
  turn: number,
  text: string,
  worldTimeMs = 0,
): LogEntry {
  return {
    id: `l-${sequence}`,
    kind,
    text: `${formatLogPrefix(worldTimeMs)} ${text}`,
    turn,
  };
}

function formatLogPrefix(worldTimeMs: number) {
  const totalMinutes = normalizeWorldMinutes(
    (worldTimeMs / GAME_DAY_DURATION_MS) * GAME_DAY_MINUTES,
  );
  const day = getWorldDayIndex(worldTimeMs) + 1;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(totalMinutes % 60)
    .toString()
    .padStart(2, '0');
  return `[Day ${day}, ${hours}:${minutes}]`;
}

function rumorForSeed(seed: string) {
  const rumors = [
    'Rumor: rift ruins hide the finest relics, but their guardians do not wake alone.',
    'Rumor: every forge can strip hidden worth from broken gear if your hands stay steady.',
    'Rumor: shardside merchants only trust business done under guarded roofs.',
    'Rumor: the farther you walk, the sharper the steel and the harsher the teeth.',
    'Rumor: tree lines near the center regrow slowly, so greedy chopping leaves long hungry roads.',
    'Rumor: shallow ponds feed the patient, but lakes hide deeper rewards and deeper trouble.',
    'Rumor: coal veins tend to sit where the land already looks half-burned and bitter.',
    'Rumor: the best armor comes from surviving one more trip than you thought you could.',
    'Rumor: some ruins look empty until the first step wakes everything inside.',
    'Rumor: a full pack is safer than a sharp blade right up until the fighting starts.',
    'Rumor: iron pays for persistence, copper pays for speed, and both punish dull tools.',
    'Rumor: hunger kills more heroes than wolves ever will.',
  ];
  return (
    rumors[Math.floor(createRng(`${seed}:rumor`)() * rumors.length)] ??
    rumors[0]
  );
}
