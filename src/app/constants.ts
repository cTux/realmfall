import type { LogKind } from '../game/state';

export const WORLD_RADIUS = 7;
export const HEX_SIZE = 34;

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowPositions {
  hero: WindowPosition;
  legend: WindowPosition;
  equipment: WindowPosition;
  inventory: WindowPosition;
  log: WindowPosition;
  combat: WindowPosition;
}

export const DEFAULT_WINDOWS: WindowPositions = {
  hero: { x: 20, y: 20 },
  legend: { x: 20, y: 240 },
  equipment: { x: 1000, y: 20 },
  inventory: { x: 820, y: 290 },
  log: { x: 420, y: 20 },
  combat: { x: 420, y: 470 },
};

export const DEFAULT_LOG_FILTERS: Record<LogKind, boolean> = {
  movement: true,
  combat: true,
  loot: true,
  survival: true,
  rumor: true,
  motd: true,
  system: true,
};
