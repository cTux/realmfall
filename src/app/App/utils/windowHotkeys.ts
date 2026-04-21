import type { WindowVisibilityState } from '../../constants';

export const WINDOW_HOTKEYS: Partial<
  Record<string, keyof WindowVisibilityState>
> = {
  h: 'hero',
  s: 'skills',
  r: 'recipes',
  c: 'hexInfo',
  e: 'equipment',
  i: 'inventory',
  g: 'log',
  m: 'settings',
};
