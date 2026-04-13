import {
  canUseItem,
  isRecipeBook,
  type Item,
  type Terrain,
} from '../../game/state';
import playerIcon from '../../assets/icons/visored-helm.svg';
import sunCloudIcon from '../../assets/icons/sun-cloud.svg';
import sparklesIcon from '../../assets/icons/sparkles.svg';
import bookCoverIcon from '../../assets/icons/book-cover.svg';
import villageIcon from '../../assets/icons/village.svg';
import armorIcon from '../../assets/icons/checked-shield.svg';
import coinsIcon from '../../assets/icons/coins.svg';
import stonePileIcon from '../../assets/icons/stone-pile.svg';
import logIcon from '../../assets/icons/log.svg';
import enemyIcon from '../../assets/icons/wolf-head.svg';
import { WINDOW_LABELS } from '../../ui/windowLabels';
import type { WindowVisibilityState } from '../constants';

export const DOCK_WINDOW_ICONS: Record<keyof WindowVisibilityState, string> = {
  worldTime: sunCloudIcon,
  hero: playerIcon,
  skills: sparklesIcon,
  recipes: bookCoverIcon,
  hexInfo: villageIcon,
  equipment: armorIcon,
  inventory: coinsIcon,
  loot: stonePileIcon,
  log: logIcon,
  combat: enemyIcon,
};

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

export function formatTerrainLabel(terrain: Terrain) {
  if (terrain === 'rift') return 'Rift';
  return terrain.charAt(0).toUpperCase() + terrain.slice(1);
}

export function getInventoryItemAction(item: Item | undefined) {
  if (!item) return 'equip';
  if (isRecipeBook(item)) return 'open-recipes';
  if (canUseItem(item)) return 'use';
  return 'equip';
}
