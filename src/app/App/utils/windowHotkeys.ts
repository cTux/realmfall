import type { WindowVisibilityState } from '../../constants';

export const WINDOW_HOTKEYS: Partial<
  Record<string, keyof WindowVisibilityState>
> = {
  d: 'worldTime',
  c: 'hero',
  s: 'skills',
  r: 'recipes',
  h: 'hexInfo',
  e: 'equipment',
  i: 'inventory',
  g: 'log',
};
