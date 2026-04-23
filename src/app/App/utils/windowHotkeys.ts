import {
  WINDOW_REGISTRY,
  WINDOW_VISIBILITY_KEYS,
  type WindowKey,
} from '../../constants';

export const WINDOW_HOTKEYS = Object.freeze(
  Object.fromEntries(
    WINDOW_VISIBILITY_KEYS.flatMap((key) => {
      const descriptor = WINDOW_REGISTRY[key];
      const hotkey = 'hotkey' in descriptor ? descriptor.hotkey : undefined;
      return hotkey ? [[hotkey, key] as const] : [];
    }),
  ) as Partial<Record<string, WindowKey>>,
);
