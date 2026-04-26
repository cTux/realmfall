import {
  type WindowKey,
  WINDOW_VISIBILITY_KEYS,
  type WindowPositions,
  type WindowVisibilityState,
} from '../../constants';

export const WINDOW_HANDLER_KEYS = WINDOW_VISIBILITY_KEYS;
export type ManagedWindowKey = WindowKey;
export type ManagedWindowPosition = {
  [K in ManagedWindowKey]: WindowPositions[K];
};
export type ManagedWindowVisibility = Pick<
  WindowVisibilityState,
  ManagedWindowKey
>;
