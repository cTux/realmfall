import type { LogKind } from '../game/state';
import { HEX_SIZE, WORLD_RADIUS, WORLD_REVEAL_RADIUS } from '../game/config';
import { DEFAULT_AUDIO_SETTINGS } from './audioSettings';
import { DEFAULT_GRAPHICS_SETTINGS } from './graphicsSettings';

export { WORLD_RADIUS, WORLD_REVEAL_RADIUS, HEX_SIZE };
export { DEFAULT_AUDIO_SETTINGS, DEFAULT_GRAPHICS_SETTINGS };

export interface WindowPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface WindowPositions {
  worldTime: WindowPosition;
  hero: WindowPosition;
  skills: WindowPosition;
  recipes: WindowPosition;
  hexInfo: WindowPosition;
  equipment: WindowPosition;
  inventory: WindowPosition;
  loot: WindowPosition;
  log: WindowPosition;
  combat: WindowPosition;
  settings: WindowPosition;
}

export interface WindowVisibilityState {
  worldTime: boolean;
  hero: boolean;
  skills: boolean;
  recipes: boolean;
  hexInfo: boolean;
  equipment: boolean;
  inventory: boolean;
  loot: boolean;
  log: boolean;
  combat: boolean;
  settings: boolean;
}

export const DEFAULT_WINDOWS: WindowPositions = {
  worldTime: { x: 420, y: 20 },
  hero: { x: 96, y: 20 },
  skills: { x: 96, y: 430 },
  recipes: { x: 620, y: 470 },
  hexInfo: { x: 280, y: 20 },
  equipment: { x: 1000, y: 20 },
  inventory: { x: 820, y: 290 },
  loot: { x: 820, y: 20 },
  log: { x: 420, y: 20 },
  combat: { x: 420, y: 470 },
  settings: { x: 188, y: 72, width: 640, height: 640 },
};

export const DEFAULT_WINDOW_VISIBILITY: WindowVisibilityState = {
  worldTime: false,
  hero: false,
  skills: false,
  recipes: false,
  hexInfo: false,
  equipment: false,
  inventory: false,
  loot: false,
  log: false,
  combat: false,
  settings: false,
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
