import {
  WINDOW_REGISTRY,
  WINDOW_VISIBILITY_KEYS,
  type WindowKey,
} from '../../constants';

export const WINDOW_HOTKEYS = Object.freeze(
  Object.fromEntries(
    WINDOW_VISIBILITY_KEYS.flatMap((key) => {
      const hotkey = WINDOW_REGISTRY[key].hotkey;
      return hotkey ? [[hotkey, key] as const] : [];
    }),
  ) as Partial<Record<string, WindowKey>>,
);
