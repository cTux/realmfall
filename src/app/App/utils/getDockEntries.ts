import { WINDOW_LABELS } from '../../../ui/windowLabels';
import type { WindowVisibilityState } from '../../constants';
import { DOCK_WINDOW_ICONS } from './dockWindowIcons';

export function getDockEntries(
  windowShown: WindowVisibilityState,
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) {
  const keys: Array<keyof WindowVisibilityState> = [
    'worldTime',
    'hero',
    'skills',
    'recipes',
    'hexInfo',
    'equipment',
    'inventory',
  ];

  if (renderLootWindow) keys.push('loot');
  keys.push('log');
  if (renderCombatWindow) keys.push('combat');

  return keys.map((key) => ({
    key,
    label: WINDOW_LABELS[key].plain,
    title: WINDOW_LABELS[key],
    icon: DOCK_WINDOW_ICONS[key],
    shown: windowShown[key],
  }));
}
