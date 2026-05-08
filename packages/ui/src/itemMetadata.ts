import type { Item } from './game/stateTypes';
import { getItemCategory, type ItemCategory } from './game/content/items';
import type { EquipmentSlotValue } from './game/content/ids';
import { GAME_TAGS, type GameTag } from './game/content/tags';

type ConsumableIconFileName = string;
type ConfiguredItemTintByKey = Record<string, string>;

export const DEFAULT_EQUIPPABLE_TINT = '#cbd5e1';
export const DEFAULT_ITEM_BORDER_TINT = '#f8fafc';
export const RECIPE_PAGE_TINT = '#22c55e';

export const CONFIGURED_ITEM_TINT_BY_KEY: ConfiguredItemTintByKey = {
  'chest-key': '#fbbf24',
  'beet-tonic': '#b91c1c',
  coal: '#475569',
  'cooked-fish': '#f59e0b',
  'copper-ingot': '#fb923c',
  'copper-ore': '#f59e0b',
  gold: '#fbbf24',
  'gold-ingot': '#fef08a',
  'gold-ore': '#fbbf24',
  'health-potion': '#f87171',
  'home-scroll': '#a78bfa',
  'iron-chunks': '#94a3b8',
  'iron-ingot': '#f8fafc',
  'iron-ore': '#94a3b8',
  lockpick: '#c084fc',
  'mana-potion': '#60a5fa',
  'platinum-ingot': '#f5f3ff',
  'platinum-ore': '#c084fc',
  'tin-ingot': '#f3f4f6',
  'tin-ore': '#9ca3af',
};

export const ITEM_KIND_ICON_BY_CATEGORY: Record<
  Exclude<ItemCategory, 'resource'>,
  'weapon' | 'armor' | 'artifact' | 'consumable'
> = {
  weapon: 'weapon',
  armor: 'armor',
  artifact: 'artifact',
  consumable: 'consumable',
};

type EquippableRole =
  | 'weapon'
  | 'shield'
  | 'head'
  | 'cloak'
  | 'jewelry'
  | 'utility'
  | 'focus';

type EquippableTone = 'light' | 'mid' | 'dark' | 'accent';

type EquippableTintScale = Record<EquippableTone, string>;

type SetEquippableFamily =
  | 'ashen'
  | 'dawn'
  | 'dusk'
  | 'ember'
  | 'hollow'
  | 'ironbound'
  | 'moss'
  | 'rift'
  | 'shard'
  | 'storm'
  | 'vale'
  | 'void'
  | 'warden';

type GenericEquippableFamily =
  | 'leather'
  | 'cloth'
  | 'metal'
  | 'jewelry'
  | 'arcane';

const EQUIPPABLE_ROLE_BY_SLOT: Record<EquipmentSlotValue, EquippableRole> = {
  weapon: 'weapon',
  offhand: 'shield',
  head: 'head',
  shoulders: 'utility',
  chest: 'utility',
  bracers: 'utility',
  hands: 'utility',
  belt: 'utility',
  legs: 'utility',
  feet: 'utility',
  ringLeft: 'jewelry',
  ringRight: 'jewelry',
  amulet: 'jewelry',
  cloak: 'cloak',
  relic: 'focus',
};

const EQUIPPABLE_TONE_BY_ROLE: Record<EquippableRole, EquippableTone> = {
  weapon: 'light',
  shield: 'mid',
  head: 'mid',
  cloak: 'dark',
  utility: 'dark',
  focus: 'accent',
  jewelry: 'accent',
};

export const SET_EQUIPPABLE_TINTS: Record<
  SetEquippableFamily,
  EquippableTintScale
> = {
  ashen: {
    light: '#d6d3d1',
    mid: '#a8a29e',
    dark: '#44403c',
    accent: '#78716c',
  },
  dawn: {
    light: '#fde68a',
    mid: '#fbbf24',
    dark: '#b45309',
    accent: '#fcd34d',
  },
  dusk: {
    light: '#c4b5fd',
    mid: '#8b5cf6',
    dark: '#5b21b6',
    accent: '#a78bfa',
  },
  ember: {
    light: '#fdba74',
    mid: '#f97316',
    dark: '#9a3412',
    accent: '#fb7185',
  },
  hollow: {
    light: '#d1d5db',
    mid: '#9ca3af',
    dark: '#4b5563',
    accent: '#e5e7eb',
  },
  ironbound: {
    light: '#d1d5db',
    mid: '#94a3b8',
    dark: '#475569',
    accent: '#e2e8f0',
  },
  moss: {
    light: '#bef264',
    mid: '#84cc16',
    dark: '#3f6212',
    accent: '#a3e635',
  },
  rift: {
    light: '#93c5fd',
    mid: '#3b82f6',
    dark: '#1d4ed8',
    accent: '#c4b5fd',
  },
  shard: {
    light: '#e9d5ff',
    mid: '#c084fc',
    dark: '#7e22ce',
    accent: '#f0abfc',
  },
  storm: {
    light: '#67e8f9',
    mid: '#22d3ee',
    dark: '#14b8a6',
    accent: '#0ea5e9',
  },
  vale: {
    light: '#86efac',
    mid: '#4ade80',
    dark: '#166534',
    accent: '#bbf7d0',
  },
  void: {
    light: '#c4b5fd',
    mid: '#7c3aed',
    dark: '#312e81',
    accent: '#a78bfa',
  },
  warden: {
    light: '#fde68a',
    mid: '#84cc16',
    dark: '#365314',
    accent: '#facc15',
  },
};

const GENERIC_EQUIPPABLE_TINTS: Record<
  GenericEquippableFamily,
  EquippableTintScale
> = {
  leather: {
    light: '#b45309',
    mid: '#92400e',
    dark: '#78350f',
    accent: '#d97706',
  },
  cloth: {
    light: '#94a3b8',
    mid: '#64748b',
    dark: '#475569',
    accent: '#cbd5e1',
  },
  metal: {
    light: '#cbd5e1',
    mid: '#94a3b8',
    dark: '#64748b',
    accent: '#e2e8f0',
  },
  jewelry: {
    light: '#fcd34d',
    mid: '#fbbf24',
    dark: '#d97706',
    accent: '#fbbf24',
  },
  arcane: {
    light: '#c084fc',
    mid: '#a855f7',
    dark: '#7e22ce',
    accent: '#60a5fa',
  },
};

const TERRAFORMING_CONSUMABLE_TINTS = {
  plains: '#3f6212',
  meadow: '#4d7c0f',
  steppe: '#65a30d',
  grove: '#166534',
  forest: '#14532d',
  marsh: '#3f6212',
  rift: '#7f1d1d',
  blasted: '#7f1d1d',
  highlands: '#365314',
  mountain: '#475569',
  dunes: '#c2410c',
  badlands: '#7c2d12',
  desert: '#92400e',
  swamp: '#1f3a1f',
} as const;

const ITEM_TINT_BY_KEY: Record<string, string> = {
  apple: '#ef4444',
  'trail-ration': '#fb923c',
  'water-flask': '#38bdf8',
  herbs: '#22c55e',
  flax: '#eab308',
  cloth: '#d6d3d1',
  string: '#f8fafc',
  logs: '#92400e',
  sticks: '#a16207',
  stone: '#94a3b8',
  'raw-fish': '#fb7185',
  'leather-scraps': '#92400e',
  'arcane-dust': '#a855f7',
  beet: '#b91c1c',
  pepper: '#22c55e',
  cabbage: '#84cc16',
  carrot: '#f97316',
  cherry: '#dc2626',
  garlic: '#f8fafc',
  leek: '#65a30d',
  lemon: '#facc15',
  peas: '#22c55e',
  tomato: '#ef4444',
  aubergine: '#7c3aed',
  meat: '#f87171',
  'town-knife': DEFAULT_EQUIPPABLE_TINT,
  'camp-spear': '#a16207',
  'hide-buckler': '#92400e',
  'scout-hood': '#64748b',
  'patchwork-hood': '#78716c',
  'settler-vest': '#a16207',
  'work-gloves': '#92400e',
  'trail-leggings': '#92400e',
  'field-boots': '#92400e',
  'copper-loop': '#fb923c',
  'copper-band': '#fb923c',
  'charm-necklace': '#fbbf24',
  'wayfarer-cloak': '#64748b',
  'hearth-totem': '#f97316',
  'beet-tonic': '#b91c1c',
};

const ITEM_TINT_BY_ICON: Record<ConsumableIconFileName, string> = {
  'aubergine.svg': '#7c3aed',
  'beet.svg': '#b91c1c',
  'bell-pepper.svg': '#22c55e',
  'cabbage.svg': '#84cc16',
  'camp-cooking-pot.svg': '#c2410c',
  'carrot.svg': '#f97316',
  'cherry.svg': '#dc2626',
  'fried-fish.svg': '#f59e0b',
  'garlic.svg': '#f8fafc',
  'herbs-bundle.svg': '#22c55e',
  'leek.svg': '#65a30d',
  'lemon.svg': '#facc15',
  'peas.svg': '#22c55e',
  'shiny-apple.svg': '#ef4444',
  'steak.svg': '#b45309',
  'tomato.svg': '#ef4444',
};

type ItemTintProbe = Pick<
  Item,
  | 'itemKey'
  | 'slot'
  | 'tint'
  | 'icon'
  | 'tags'
  | 'healing'
  | 'hunger'
  | 'thirst'
  | 'power'
  | 'defense'
  | 'maxHp'
  | 'name'
>;

export type ItemCategoryIconKey =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable';

export function getConfiguredItemTint(itemKey?: string | null) {
  if (!itemKey) return undefined;
  if (CONFIGURED_ITEM_TINT_BY_KEY[itemKey]) {
    return CONFIGURED_ITEM_TINT_BY_KEY[itemKey];
  }

  const terrain = itemKey.startsWith('terraforming-')
    ? itemKey.slice('terraforming-'.length)
    : '';
  return terrain
    ? TERRAFORMING_CONSUMABLE_TINTS[
        terrain as keyof typeof TERRAFORMING_CONSUMABLE_TINTS
      ]
    : undefined;
}

export function getItemKindIcon(category: Exclude<ItemCategory, 'resource'>) {
  return ITEM_KIND_ICON_BY_CATEGORY[category];
}

export function getConsumableIconTint(icon: string) {
  const normalizedIcon = getIconFileName(icon);
  return ITEM_TINT_BY_ICON[normalizedIcon];
}

export function getItemTintFallback(item: ItemTintProbe) {
  if (item.tint) return item.tint;

  const itemKeyTint = item.itemKey
    ? getItemTintByItemKey(item.itemKey)
    : undefined;
  if (itemKeyTint) return itemKeyTint;

  const category = getItemCategory(item);
  if (category === 'consumable') {
    return getConsumableTint(item);
  }

  if (isEquippableCategory(category)) {
    return getEquippableTint(item);
  }

  if (hasItemTag(item, GAME_TAGS.item.wood)) return '#92400e';
  if (hasItemTag(item, GAME_TAGS.item.animalProduct)) return '#92400e';
  if (hasItemTag(item, GAME_TAGS.item.mana)) return '#a855f7';

  return undefined;
}

export function getItemTintByItemKey(itemKey: string) {
  return getConfiguredItemTint(itemKey) ?? ITEM_TINT_BY_KEY[itemKey];
}

export function getEquippableTint(item: ItemTintProbe) {
  const tintScale = getEquippableTintScale(item);
  const role = item.slot ? EQUIPPABLE_ROLE_BY_SLOT[item.slot] : undefined;
  if (!tintScale || !role) return DEFAULT_EQUIPPABLE_TINT;

  return tintScale[EQUIPPABLE_TONE_BY_ROLE[role]];
}

function getConsumableTint(item: ItemTintProbe) {
  const iconTint = getConsumableIconTint(item.icon ?? '');
  if (iconTint) return iconTint;

  if (item.itemKey) {
    const itemKeyTint = getItemTintByItemKey(item.itemKey);
    if (itemKeyTint) return itemKeyTint;
  }

  if (
    (item.thirst ?? 0) > 0 &&
    item.hunger === 0 &&
    (item.healing ?? 0) === 0
  ) {
    return '#38bdf8';
  }

  return '#f59e0b';
}

function getEquippableTintScale(item: ItemTintProbe) {
  const itemKey = item.itemKey ?? '';
  const setFamily = getSetEquippableFamily(itemKey);
  if (setFamily) return SET_EQUIPPABLE_TINTS[setFamily];

  const genericFamily = getGenericEquippableFamily(item);
  return genericFamily ? GENERIC_EQUIPPABLE_TINTS[genericFamily] : undefined;
}

function getSetEquippableFamily(itemKey: string) {
  const [prefix] = itemKey.split('-');
  if (prefix in SET_EQUIPPABLE_TINTS) {
    return prefix as SetEquippableFamily;
  }

  return undefined;
}

function getGenericEquippableFamily(item: ItemTintProbe) {
  if (isJewelryItem(item)) return 'jewelry';
  if (isArcaneItem(item)) return 'arcane';
  if (isClothItem(item)) return 'cloth';
  if (isLeatherItem(item)) return 'leather';
  if (isMetalItem(item)) return 'metal';
  return undefined;
}

function isJewelryItem(item: ItemTintProbe) {
  return (
    item.itemKey?.includes('ring') ||
    item.itemKey?.includes('necklace') ||
    item.itemKey?.includes('amulet') ||
    item.itemKey?.includes('charm') ||
    hasItemTag(item, GAME_TAGS.item.slotRingLeft) ||
    hasItemTag(item, GAME_TAGS.item.slotRingRight) ||
    hasItemTag(item, GAME_TAGS.item.slotAmulet)
  );
}

function isArcaneItem(item: ItemTintProbe) {
  return (
    item.slot === 'relic' ||
    hasItemTag(item, GAME_TAGS.item.mana) ||
    hasItemKeyFragment(
      item,
      'wand',
      'magical-sphere',
      'sphere',
      'orb',
      'totem',
      'relic',
      'arcane',
    )
  );
}

function isClothItem(item: ItemTintProbe) {
  return (
    hasItemTag(item, GAME_TAGS.item.cloth) ||
    hasItemKeyFragment(
      item,
      'hood',
      'cloak',
      'vest',
      'mantle',
      'leggings',
      'robe',
      'wrap',
    )
  );
}

function isLeatherItem(item: ItemTintProbe) {
  return hasItemKeyFragment(
    item,
    'hide',
    'leather',
    'boots',
    'gloves',
    'belt',
    'buckler',
    'trail',
    'field',
    'work',
    'patchwork',
  );
}

function isMetalItem(item: ItemTintProbe) {
  return hasItemKeyFragment(
    item,
    'dagger',
    'blade',
    'knife',
    'sword',
    'axe',
    'hammer',
    'mace',
    'spear',
    'shield',
    'helm',
    'helmet',
    'shoulders',
    'chest',
    'gauntlet',
    'bracer',
    'iron',
    'steel',
    'copper',
    'tin',
    'gold',
    'platinum',
  );
}

function hasItemKeyFragment(item: ItemTintProbe, ...fragments: string[]) {
  const itemKey = item.itemKey ?? '';
  return fragments.some((fragment) => itemKey.includes(fragment));
}

function hasItemTag(item: ItemTintProbe, tag: GameTag) {
  return (item.tags ?? []).includes(tag);
}

function isEquippableCategory(category: ItemCategory) {
  return (
    category === 'weapon' || category === 'armor' || category === 'artifact'
  );
}

function getIconFileName(icon: string) {
  const clean = icon.split('?')[0]?.split('#')[0] ?? '';
  return (
    clean
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean)
      .pop()
      ?.toLowerCase()
      .trim() ?? ''
  );
}
