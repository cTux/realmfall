import { WINDOW_LABELS } from '../../../ui/windowLabels';
import type { WindowVisibilityState } from '../../constants';
import { DOCK_WINDOW_ICONS } from './dockWindowIcons';

export function getDockEntries(
  windowShown: WindowVisibilityState,
  requiresAttention: Partial<Record<keyof WindowVisibilityState, boolean>> = {},
) {
  const keys: Array<keyof WindowVisibilityState> = [
    'hero',
    'skills',
    'recipes',
    'hexInfo',
    'equipment',
    'inventory',
    'log',
    'settings',
  ];

  return keys.map((key) => {
    const align: 'start' | 'end' = key === 'settings' ? 'end' : 'start';

    return {
      key,
      label: WINDOW_LABELS[key].plain,
      title: WINDOW_LABELS[key],
      icon: DOCK_WINDOW_ICONS[key],
      shown: windowShown[key],
      requiresAttention: requiresAttention[key] ?? false,
      align,
    };
  });
}
