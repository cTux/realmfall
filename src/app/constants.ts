import playerIcon from '../assets/icons/visored-helm.svg';
import sparklesIcon from '../assets/icons/sparkles.svg';
import bookCoverIcon from '../assets/icons/book-cover.svg';
import tiedScrollIcon from '../assets/icons/tied-scroll.svg';
import villageIcon from '../assets/icons/village.svg';
import armorIcon from '../assets/icons/checked-shield.svg';
import stonePileIcon from '../assets/icons/stone-pile.svg';
import backpackIcon from '../assets/game-icons/delapouite/backpack.svg';
import enemyIcon from '../assets/icons/wolf-head.svg';
import gearsIcon from '../assets/icons/gears.svg';
import { LOG_KINDS, type LogKind } from '../game/stateTypes';
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

type WindowMountSource = 'windowShown' | 'lootTransition' | 'combatTransition';

export const WINDOW_REGISTRY = {
  hero: {
    defaultPosition: { x: 96, y: 20 },
    dock: true,
    appDeferred: false,
    mountSource: 'windowShown',
    hotkey: 'h',
    icon: playerIcon,
  },
  skills: {
    defaultPosition: { x: 96, y: 430 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 's',
    icon: sparklesIcon,
  },
  recipes: {
    defaultPosition: { x: 620, y: 470 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 'r',
    icon: bookCoverIcon,
  },
  hexInfo: {
    defaultPosition: { x: 280, y: 20 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 'c',
    icon: villageIcon,
  },
  equipment: {
    defaultPosition: { x: 1000, y: 20 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 'e',
    icon: armorIcon,
  },
  inventory: {
    defaultPosition: { x: 820, y: 290 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 'i',
    icon: backpackIcon,
  },
  loot: {
    defaultPosition: { x: 820, y: 20 },
    dock: false,
    appDeferred: false,
    mountSource: 'lootTransition',
    icon: stonePileIcon,
  },
  log: {
    defaultPosition: { x: 420, y: 20 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 'g',
    icon: tiedScrollIcon,
  },
  combat: {
    defaultPosition: { x: 420, y: 470 },
    dock: false,
    appDeferred: false,
    mountSource: 'combatTransition',
    icon: enemyIcon,
  },
  settings: {
    defaultPosition: { x: 188, y: 72, width: 640, height: 640 },
    dock: true,
    appDeferred: true,
    mountSource: 'windowShown',
    hotkey: 'm',
    icon: gearsIcon,
  },
} as const satisfies Record<
  string,
  {
    defaultPosition: WindowPosition;
    dock: boolean;
    appDeferred: boolean;
    mountSource: WindowMountSource;
    hotkey?: string;
    icon: string;
  }
>;

export type WindowKey = keyof typeof WINDOW_REGISTRY;
export type WindowPositions = Record<WindowKey, WindowPosition>;
export type WindowVisibilityState = Record<WindowKey, boolean>;
export type DockWindowKey = {
  [K in WindowKey]: (typeof WINDOW_REGISTRY)[K]['dock'] extends true
    ? K
    : never;
}[WindowKey];
export type AppDeferredWindowKey = {
  [K in WindowKey]: (typeof WINDOW_REGISTRY)[K]['appDeferred'] extends true
    ? K
    : never;
}[WindowKey];

export const WINDOW_VISIBILITY_KEYS = Object.freeze(
  Object.keys(WINDOW_REGISTRY) as WindowKey[],
);
export const WINDOW_DOCK_KEYS = Object.freeze(
  WINDOW_VISIBILITY_KEYS.filter(
    (key): key is DockWindowKey => WINDOW_REGISTRY[key].dock,
  ),
);
export const WINDOW_COMPONENT_DEFERRED_KEYS = Object.freeze(
  WINDOW_VISIBILITY_KEYS.filter(
    (key): key is AppDeferredWindowKey => WINDOW_REGISTRY[key].appDeferred,
  ),
);

export function createDefaultWindowPositions(): WindowPositions {
  return Object.fromEntries(
    WINDOW_VISIBILITY_KEYS.map((key) => [
      key,
      { ...WINDOW_REGISTRY[key].defaultPosition },
    ]),
  ) as WindowPositions;
}

export const DEFAULT_WINDOWS = createDefaultWindowPositions();

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
