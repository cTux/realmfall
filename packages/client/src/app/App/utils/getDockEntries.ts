import { WINDOW_LABELS } from '../../../ui/windowLabels';
import {
  type DockWindowKey,
  WINDOW_DOCK_KEYS,
  WINDOW_REGISTRY,
  type WindowVisibilityState,
} from '../../constants';

export function getDockEntries(
  windowShown: WindowVisibilityState,
  requiresAttention: Partial<Record<keyof WindowVisibilityState, boolean>> = {},
  dockKeys: readonly DockWindowKey[] = WINDOW_DOCK_KEYS,
) {
  return dockKeys.map((key) => {
    const align: 'start' | 'end' =
      key === 'settings' || key === 'debug' ? 'end' : 'start';

    return {
      key,
      label: WINDOW_LABELS[key].plain,
      title: WINDOW_LABELS[key],
      icon: WINDOW_REGISTRY[key].icon,
      shown: windowShown[key],
      requiresAttention: requiresAttention[key] ?? false,
      align,
    };
  });
}
