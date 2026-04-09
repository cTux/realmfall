import type { LogKind } from '../game/state';

export const WORLD_RADIUS = 8;
export const HEX_SIZE = 34;

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowPositions {
  hero: WindowPosition;
  legend: WindowPosition;
  hexInfo: WindowPosition;
  equipment: WindowPosition;
  inventory: WindowPosition;
  loot: WindowPosition;
  log: WindowPosition;
  combat: WindowPosition;
}

export interface WindowCollapsedState {
  hero: boolean;
  legend: boolean;
  hexInfo: boolean;
  equipment: boolean;
  inventory: boolean;
  loot: boolean;
  log: boolean;
  combat: boolean;
}

export const DEFAULT_WINDOWS: WindowPositions = {
  hero: { x: 20, y: 20 },
  legend: { x: 20, y: 240 },
  hexInfo: { x: 280, y: 20 },
  equipment: { x: 1000, y: 20 },
  inventory: { x: 820, y: 290 },
  loot: { x: 820, y: 20 },
  log: { x: 420, y: 20 },
  combat: { x: 420, y: 470 },
};

export const DEFAULT_WINDOW_COLLAPSED: WindowCollapsedState = {
  hero: false,
  legend: false,
  hexInfo: false,
  equipment: false,
  inventory: false,
  loot: false,
  log: false,
  combat: false,
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
