import { WINDOW_LABELS } from '../../../ui/windowLabels';
import {
  WINDOW_DOCK_KEYS,
  WINDOW_REGISTRY,
  type WindowVisibilityState,
} from '../../constants';

export function getDockEntries(
  windowShown: WindowVisibilityState,
  requiresAttention: Partial<Record<keyof WindowVisibilityState, boolean>> = {},
) {
  return WINDOW_DOCK_KEYS.map((key) => {
    const align: 'start' | 'end' = key === 'settings' ? 'end' : 'start';

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
