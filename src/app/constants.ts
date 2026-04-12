import type { LogKind } from '../game/state';
import { HEX_SIZE, WORLD_RADIUS, WORLD_REVEAL_RADIUS } from '../game/config';

export { WORLD_RADIUS, WORLD_REVEAL_RADIUS, HEX_SIZE };

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowPositions {
  hero: WindowPosition;
  skills: WindowPosition;
  recipes: WindowPosition;
  hexInfo: WindowPosition;
  equipment: WindowPosition;
  inventory: WindowPosition;
  loot: WindowPosition;
  log: WindowPosition;
  combat: WindowPosition;
}

export interface WindowVisibilityState {
  hero: boolean;
  skills: boolean;
  recipes: boolean;
  hexInfo: boolean;
  equipment: boolean;
  inventory: boolean;
  loot: boolean;
  log: boolean;
  combat: boolean;
}

export const DEFAULT_WINDOWS: WindowPositions = {
  hero: { x: 96, y: 20 },
  skills: { x: 96, y: 430 },
  recipes: { x: 620, y: 470 },
  hexInfo: { x: 280, y: 20 },
  equipment: { x: 1000, y: 20 },
  inventory: { x: 820, y: 290 },
  loot: { x: 820, y: 20 },
  log: { x: 420, y: 20 },
  combat: { x: 420, y: 470 },
};

export const DEFAULT_WINDOW_VISIBILITY: WindowVisibilityState = {
  hero: false,
  skills: false,
  recipes: false,
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
