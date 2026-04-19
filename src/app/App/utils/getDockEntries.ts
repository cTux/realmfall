import { WINDOW_LABELS } from '../../../ui/windowLabels';
import type { WindowVisibilityState } from '../../constants';
import { DOCK_WINDOW_ICONS } from './dockWindowIcons';

export function getDockEntries(
  windowShown: WindowVisibilityState,
  keepLootWindowMounted: boolean,
  keepCombatWindowMounted: boolean,
) {
  const keys: Array<keyof WindowVisibilityState> = [
    'worldTime',
    'hero',
    'audioPlayer',
    'skills',
    'recipes',
    'hexInfo',
    'equipment',
    'inventory',
  ];

  if (keepLootWindowMounted) keys.push('loot');
  keys.push('log');
  if (keepCombatWindowMounted) keys.push('combat');
  keys.push('settings');

  return keys.map((key) => {
    const align: 'start' | 'end' = key === 'settings' ? 'end' : 'start';

    return {
      key,
      label: WINDOW_LABELS[key].plain,
      title: WINDOW_LABELS[key],
      icon: DOCK_WINDOW_ICONS[key],
      shown: windowShown[key],
      align,
    };
  });
}
