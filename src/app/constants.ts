import { LOG_KINDS, type LogKind } from '../game/state';
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

export const WINDOW_VISIBILITY_KEYS = [
  'hero',
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'loot',
  'log',
  'combat',
  'settings',
] as const;

export type WindowKey = (typeof WINDOW_VISIBILITY_KEYS)[number];
export type WindowPositions = Record<WindowKey, WindowPosition>;
export type WindowVisibilityState = Record<WindowKey, boolean>;
export const WINDOW_DOCK_KEYS = [
  'hero',
  'skills',
  'recipes',
  'hexInfo',
  'equipment',
  'inventory',
  'log',
  'settings',
] as const satisfies readonly WindowKey[];

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
  settings: { x: 188, y: 72, width: 640, height: 640 },
};

export function createWindowVisibilityState(
  shown = false,
): WindowVisibilityState {
  return Object.fromEntries(
    WINDOW_VISIBILITY_KEYS.map((key) => [key, shown] as const),
  ) as WindowVisibilityState;
}

export function createLogFilters(enabled = true): Record<LogKind, boolean> {
  return Object.fromEntries(
    LOG_KINDS.map((kind) => [kind, enabled] as const),
  ) as Record<LogKind, boolean>;
}

export const DEFAULT_WINDOW_VISIBILITY = createWindowVisibilityState();
export const DEFAULT_LOG_FILTERS = createLogFilters();
