import {
  canUseItem,
  isRecipeBook,
  type Item,
  type Terrain,
} from '../../game/state';
import { Icons } from '../../ui/icons';
import { WINDOW_LABELS } from '../../ui/components/windowLabels';
import type { WindowVisibilityState } from '../constants';

export const DOCK_WINDOW_ICONS: Record<keyof WindowVisibilityState, string> = {
  hero: Icons.Player,
  skills: Icons.Sparkles,
  recipes: Icons.BookCover,
  legend: Icons.Totem,
  hexInfo: Icons.Village,
  equipment: Icons.Armor,
  inventory: Icons.Coins,
  loot: Icons.StonePile,
  log: Icons.Log,
  combat: Icons.Enemy,
};

export const WINDOW_HOTKEYS: Partial<
  Record<string, keyof WindowVisibilityState>
> = {
  c: 'hero',
  s: 'skills',
  r: 'recipes',
  l: 'legend',
  h: 'hexInfo',
  e: 'equipment',
  i: 'inventory',
  g: 'log',
};

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable,
  );
}

export function getDockEntries(
  windowShown: WindowVisibilityState,
  renderLootWindow: boolean,
  renderCombatWindow: boolean,
) {
  const keys: Array<keyof WindowVisibilityState> = [
    'hero',
    'skills',
    'recipes',
    'legend',
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

export function formatTerrainLabel(terrain: Terrain) {
  return terrain.charAt(0).toUpperCase() + terrain.slice(1);
}

export function getInventoryItemAction(item: Item | undefined) {
  if (!item) return 'equip';
  if (isRecipeBook(item)) return 'open-recipes';
  if (canUseItem(item)) return 'use';
  return 'equip';
}
