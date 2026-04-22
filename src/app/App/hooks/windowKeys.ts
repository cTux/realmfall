import {
  WINDOW_VISIBILITY_KEYS,
  type WindowPositions,
  type WindowVisibilityState,
} from '../../constants';

export const WINDOW_HANDLER_KEYS = WINDOW_VISIBILITY_KEYS;

export const DEFERRED_WINDOW_KEYS = [
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

export type ManagedWindowKey = (typeof WINDOW_HANDLER_KEYS)[number];
export type DeferredWindowKey = (typeof DEFERRED_WINDOW_KEYS)[number];
export type ManagedWindowPosition = {
  [K in ManagedWindowKey]: WindowPositions[K];
};
export type ManagedWindowVisibility = Pick<
  WindowVisibilityState,
  ManagedWindowKey
>;
