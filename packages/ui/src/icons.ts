import type { EquipmentSlot, Item, ItemRarity } from './game/stateTypes';
import {
  getItemCategory,
  isEquippableItemCategory,
} from './game/content/items';
import { EquipmentSlotId } from './game/content/ids';
import { resolveAssetUrl, resolveIconAsset } from './iconAssets';
import { getConfiguredItemTint, getConsumableIconTint } from './itemMetadata';

const RECIPE_PAGE_TINT = '#22c55e';
const FALLBACK_TINT = '#f8fafc';
const DEFAULT_EQUIPPABLE_TINT = '#cbd5e1';

const RECIPE_ITEM_TAG = 'item.recipe';
const WOOD_ITEM_TAG = 'item.wood';
const ANIMAL_PRODUCT_TAG = 'item.animalProduct';
const MANA_ITEM_TAG = 'item.mana';
const CLOTH_TAG = 'item.cloth';
const TOTEM_ITEM_TAG = 'item.totem';

const iconUrl = resolveAssetUrl;

const Icons = {
  Weapon: iconUrl('../../../client/src/assets/icons/plain-dagger.svg'),
  Armor: iconUrl('../../../client/src/assets/icons/checked-shield.svg'),
  Artifact: iconUrl('../../../client/src/assets/icons/ankh.svg'),
  Consumable: iconUrl('../../../client/src/assets/icons/potion-ball.svg'),
  Hood: iconUrl('../../../client/src/assets/icons/hood.svg'),
  Gauntlet: iconUrl('../../../client/src/assets/icons/mailed-fist.svg'),
  Boots: iconUrl('../../../client/src/assets/icons/steeltoe-boots.svg'),
  Orb: iconUrl('../../../client/src/assets/icons/crystal-ball.svg'),
  Totem: iconUrl('../../../client/src/assets/icons/totem.svg'),
  Chest: iconUrl('../../../client/src/assets/icons/spiked-armor.svg'),
  ScrollQuill: iconUrl(
    '../../../client/src/game-icons/delapouite/scroll-quill.svg',
  ),
} as const;

const ItemSlotIcon: Record<EquipmentSlot, string> = {
  [EquipmentSlotId.Weapon]: Icons.Weapon,
  [EquipmentSlotId.Offhand]: Icons.Armor,
  [EquipmentSlotId.Head]: Icons.Hood,
  [EquipmentSlotId.Shoulders]: Icons.Armor,
  [EquipmentSlotId.Chest]: Icons.Chest,
  [EquipmentSlotId.Bracers]: Icons.Gauntlet,
  [EquipmentSlotId.Hands]: Icons.Gauntlet,
  [EquipmentSlotId.Belt]: Icons.Armor,
  [EquipmentSlotId.Legs]: Icons.Chest,
  [EquipmentSlotId.Feet]: Icons.Boots,
  [EquipmentSlotId.RingLeft]: Icons.Artifact,
  [EquipmentSlotId.RingRight]: Icons.Artifact,
  [EquipmentSlotId.Amulet]: Icons.Artifact,
  [EquipmentSlotId.Cloak]: Icons.Hood,
  [EquipmentSlotId.Relic]: Icons.Orb,
};

const ItemKindByCategory: Record<
  Exclude<ReturnType<typeof getItemCategory>, 'resource'>,
  string
> = {
  weapon: Icons.Weapon,
  armor: Icons.Artifact,
  artifact: Icons.Artifact,
  consumable: Icons.Consumable,
};

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
  'beet-tonic': '#b91c1c',
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
};

const EQUIPPABLE_ROLE_BY_SLOT: Record<EquipmentSlot, string> = {
  [EquipmentSlotId.Weapon]: 'weapon',
  [EquipmentSlotId.Offhand]: 'shield',
  [EquipmentSlotId.Head]: 'head',
  [EquipmentSlotId.Shoulders]: 'utility',
  [EquipmentSlotId.Chest]: 'utility',
  [EquipmentSlotId.Bracers]: 'utility',
  [EquipmentSlotId.Hands]: 'utility',
  [EquipmentSlotId.Belt]: 'utility',
  [EquipmentSlotId.Legs]: 'utility',
  [EquipmentSlotId.Feet]: 'utility',
  [EquipmentSlotId.RingLeft]: 'jewelry',
  [EquipmentSlotId.RingRight]: 'jewelry',
  [EquipmentSlotId.Amulet]: 'jewelry',
  [EquipmentSlotId.Cloak]: 'cloak',
  [EquipmentSlotId.Relic]: 'focus',
} as const;

const EQUIPPABLE_TONE_BY_ROLE: Record<
  string,
  'light' | 'mid' | 'dark' | 'accent'
> = {
  weapon: 'light',
  shield: 'mid',
  head: 'mid',
  cloak: 'dark',
  utility: 'dark',
  focus: 'accent',
  jewelry: 'accent',
};

const SET_EQUIPPABLE_TINTS: Record<string, Record<string, string>> = {
  ashen: {
    light: '#d6d3d1',
    mid: '#a8a29e',
    dark: '#44403c',
    accent: '#78716c',
  },
  dawn: {
    light: '#fde68a',
    mid: '#fbbf24',
    dark: '#5b21b6',
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

const GENERIC_EQUIPPABLE_TINTS: Record<string, Record<string, string>> = {
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

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#f8fafc',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fb923c',
};

function isRecipePage(item: Item) {
  return item.recipeId != null || (item.tags ?? []).includes(RECIPE_ITEM_TAG);
}

export function iconForItem(item?: Item, slot?: EquipmentSlot) {
  if (item && isRecipePage(item)) {
    return resolveIconAsset(Icons.ScrollQuill);
  }

  const slotIcon = slot ? ItemSlotIcon[slot] : undefined;
  const equippedSlotIcon = item?.slot ? ItemSlotIcon[item.slot] : undefined;
  const totemIcon = item?.tags?.includes(TOTEM_ITEM_TAG)
    ? Icons.Totem
    : undefined;
  const configuredIcon = item?.icon;
  const category = item ? getItemCategory(item) : undefined;
  const categoryIcon =
    category && category !== 'resource'
      ? ItemKindByCategory[category]
      : undefined;

  return resolveIconAsset(
    configuredIcon ??
      totemIcon ??
      equippedSlotIcon ??
      categoryIcon ??
      slotIcon ??
      Icons.Artifact,
  );
}

export function itemBorderColor(item?: Item) {
  if (!item) return RARITY_COLOR.common;
  return isEquippableItemCategory(getItemCategory(item))
    ? RARITY_COLOR[item.rarity]
    : FALLBACK_TINT;
}

export function itemTint(item?: Item) {
  if (!item) return RARITY_COLOR.common;
  if (isRecipePage(item)) return RECIPE_PAGE_TINT;

  if (item.itemKey) {
    const configuredTint = getConfiguredItemTint(item.itemKey);
    if (configuredTint) return configuredTint;
  }

  return getFallbackItemTint(item) ?? FALLBACK_TINT;
}

function getFallbackItemTint(item: Item) {
  const configuredKey = item.itemKey;
  if (configuredKey && ITEM_TINT_BY_KEY[configuredKey]) {
    return ITEM_TINT_BY_KEY[configuredKey];
  }

  const category = getItemCategory(item);
  if (category === 'consumable') {
    return getConsumableTint(item);
  }

  if (isEquippableItemCategory(category)) {
    return getEquippableTint(item);
  }

  if (hasGameTag(item, WOOD_ITEM_TAG)) return '#92400e';
  if (hasGameTag(item, ANIMAL_PRODUCT_TAG)) return '#92400e';
  if (hasGameTag(item, MANA_ITEM_TAG)) return '#a855f7';

  return FALLBACK_TINT;
}

function getConsumableTint(item: Item) {
  const itemIcon = item.icon;
  if (itemIcon) {
    const iconTint = getConsumableIconTint(itemIcon);
    if (iconTint) return iconTint;
  }

  if ((item.thirst ?? 0) > 0 && item.hunger === 0 && item.healing === 0) {
    return '#38bdf8';
  }

  return '#f59e0b';
}

function getEquippableTint(item: Item) {
  const tintScale = getEquippableTintScale(item);
  const role = item.slot ? EQUIPPABLE_ROLE_BY_SLOT[item.slot] : undefined;
  if (!tintScale || !role) return DEFAULT_EQUIPPABLE_TINT;

  return tintScale[EQUIPPABLE_TONE_BY_ROLE[role]];
}

function getEquippableTintScale(item: Item) {
  const itemKey = item.itemKey ?? '';
  const setFamily = getSetEquippableFamily(itemKey);
  if (setFamily) return SET_EQUIPPABLE_TINTS[setFamily];

  const genericFamily = getGenericEquippableFamily(item);
  return genericFamily ? GENERIC_EQUIPPABLE_TINTS[genericFamily] : undefined;
}

function getSetEquippableFamily(itemKey: string) {
  const [prefix] = itemKey.split('-');
  return prefix in SET_EQUIPPABLE_TINTS ? prefix : undefined;
}

function getGenericEquippableFamily(item: Item) {
  if (isJewelryItem(item)) return 'jewelry';
  if (isArcaneItem(item)) return 'arcane';
  if (isClothItem(item)) return 'cloth';
  if (isLeatherItem(item)) return 'leather';
  if (isMetalItem(item)) return 'metal';
  return undefined;
}

function isJewelryItem(item: Item) {
  return (
    item.slot === EquipmentSlotId.RingLeft ||
    item.slot === EquipmentSlotId.RingRight ||
    item.slot === EquipmentSlotId.Amulet ||
    hasItemKeyFragment(item, 'ring', 'necklace', 'amulet', 'charm')
  );
}

function isArcaneItem(item: Item) {
  return (
    item.slot === EquipmentSlotId.Relic ||
    hasGameTag(item, MANA_ITEM_TAG) ||
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

function isClothItem(item: Item) {
  return (
    hasGameTag(item, CLOTH_TAG) ||
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

function isLeatherItem(item: Item) {
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

function isMetalItem(item: Item) {
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

function hasItemKeyFragment(item: Item, ...fragments: string[]) {
  const itemKey = item.itemKey ?? '';
  return fragments.some((fragment) => itemKey.includes(fragment));
}

function hasGameTag(item: Item, tag: string) {
  return (item.tags ?? []).includes(tag as never);
}
