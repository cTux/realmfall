import { LOG_KINDS, type LogKind } from '@realmfall/core/game/stateTypes';
import {
  HEX_SIZE,
  WORLD_RADIUS,
  WORLD_REVEAL_RADIUS,
} from '@realmfall/core/game/config';
import {
  CLIENT_WINDOW_REGISTRY,
  type WindowMountSource,
  type WindowPosition,
} from '../client.config';
import { DEFAULT_AUDIO_SETTINGS } from './audioSettings';
import { DEFAULT_GAMEPLAY_SETTINGS } from './gameplaySettings';
import { DEFAULT_GRAPHICS_SETTINGS } from './graphicsSettings';
import { DEFAULT_INTERFACE_SETTINGS } from './interfaceSettings';

export { WORLD_RADIUS, WORLD_REVEAL_RADIUS, HEX_SIZE };
export {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_GAMEPLAY_SETTINGS,
  DEFAULT_GRAPHICS_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
};

export { type WindowPosition };

export const WINDOW_REGISTRY = CLIENT_WINDOW_REGISTRY satisfies Record<
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
