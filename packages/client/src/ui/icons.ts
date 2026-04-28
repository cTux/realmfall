import {
  getEnemyConfig,
  getItemConfig,
  getStructureConfig,
} from '../game/stateSelectors';
import type { EquipmentSlot, Enemy, Item, SkillName } from '../game/stateTypes';
import { EquipmentSlotId } from '../game/content/ids';
import {
  getItemCategory,
  isEquippableItemCategory,
} from '../game/content/items';
import playerIcon from '../assets/icons/visored-helm.svg';
import enemyIcon from '../assets/icons/wolf-head.svg';
import weaponIcon from '../assets/icons/plain-dagger.svg';
import armorIcon from '../assets/icons/checked-shield.svg';
import artifactIcon from '../assets/icons/ankh.svg';
import consumableIcon from '../assets/icons/potion-ball.svg';
import hoodIcon from '../assets/icons/hood.svg';
import mailedFistIcon from '../assets/icons/mailed-fist.svg';
import steeltoeBootsIcon from '../assets/icons/steeltoe-boots.svg';
import crystalBallIcon from '../assets/icons/crystal-ball.svg';
import hornedHelmIcon from '../assets/icons/horned-helm.svg';
import spikedArmorIcon from '../assets/icons/spiked-armor.svg';
import villageIcon from '../assets/icons/village.svg';
import dungeonGateIcon from '../assets/icons/dungeon-gate.svg';
import anvilIcon from '../assets/icons/anvil.svg';
import animalHideIcon from '../assets/icons/animal-hide.svg';
import stonePileIcon from '../assets/icons/stone-pile.svg';
import axeInStumpIcon from '../assets/icons/axe-in-stump.svg';
const coinsIcon = `${import.meta.env.BASE_URL}assets/icons/coins.svg`;
import herbsBundleIcon from '../assets/icons/herbs-bundle.svg';
import scytheIcon from '../assets/icons/scythe.svg';
import logIcon from '../assets/icons/log.svg';
import oreIcon from '../assets/icons/ore.svg';
import goldBarIcon from '../assets/icons/gold-bar.svg';
import salmonIcon from '../assets/icons/salmon.svg';
import shinyAppleIcon from '../assets/icons/shiny-apple.svg';
import sparklesIcon from '../assets/icons/sparkles.svg';
import stoneBlockIcon from '../assets/icons/stone-block.svg';
import spillIcon from '../assets/icons/spill.svg';
import sunCloudIcon from '../assets/icons/sun-cloud.svg';
import rainingIcon from '../assets/icons/raining.svg';
import snowingIcon from '../assets/icons/snowing.svg';
import highGrassIcon from '../assets/icons/high-grass.svg';
import totemIcon from '../assets/icons/totem.svg';
import woodStickIcon from '../assets/icons/wood-stick.svg';
import bookCoverIcon from '../assets/icons/book-cover.svg';
import friedFishIcon from '../assets/icons/fried-fish.svg';
import campCookingPotIcon from '../assets/icons/camp-cooking-pot.svg';
import stoneCraftingIcon from '../assets/icons/stone-crafting.svg';
import spiderAltIcon from '../assets/icons/spider-alt.svg';
import tiedScrollIcon from '../assets/icons/tied-scroll.svg';
import scrollQuillIcon from '../assets/game-icons/delapouite/scroll-quill.svg';
import arrowDunkIcon from '../assets/icons/arrow-dunk.svg';
import rolledClothIcon from '../assets/icons/rolled-cloth.svg';
import gearsIcon from '../assets/icons/gears.svg';
import padlockIcon from '../assets/icons/padlock.svg';
import furnaceIcon from '../assets/icons/furnace.svg';
import minerIcon from '../assets/icons/miner.svg';
import type { StructureType } from '../game/stateTypes';
import { GAME_TAGS, type GameTag } from '../game/content/tags';
import { isRecipePage } from '../game/inventory';
import { resolveIconAsset } from './iconAssets';
import { rarityColor } from './rarity';

export const Icons = {
  Player: playerIcon,
  Enemy: enemyIcon,
  Weapon: weaponIcon,
  Armor: armorIcon,
  Artifact: artifactIcon,
  Consumable: consumableIcon,
  Hood: hoodIcon,
  Gauntlet: mailedFistIcon,
  Boots: steeltoeBootsIcon,
  Orb: crystalBallIcon,
  HornedHelm: hornedHelmIcon,
  Chest: spikedArmorIcon,
  Village: villageIcon,
  DungeonGate: dungeonGateIcon,
  Anvil: anvilIcon,
  AnimalHide: animalHideIcon,
  StonePile: stonePileIcon,
  AxeInStump: axeInStumpIcon,
  Coins: coinsIcon,
  HerbsBundle: herbsBundleIcon,
  Scythe: scytheIcon,
  Log: logIcon,
  Ore: oreIcon,
  GoldBar: goldBarIcon,
  Salmon: salmonIcon,
  ShinyApple: shinyAppleIcon,
  Sparkles: sparklesIcon,
  StoneBlock: stoneBlockIcon,
  Spill: spillIcon,
  SunCloud: sunCloudIcon,
  Raining: rainingIcon,
  Snowing: snowingIcon,
  HighGrass: highGrassIcon,
  Totem: totemIcon,
  WoodStick: woodStickIcon,
  BookCover: bookCoverIcon,
  FriedFish: friedFishIcon,
  CampCookingPot: campCookingPotIcon,
  StoneCrafting: stoneCraftingIcon,
  Spider: spiderAltIcon,
  TiedScroll: tiedScrollIcon,
  ScrollQuill: scrollQuillIcon,
  ArrowDunk: arrowDunkIcon,
  RolledCloth: rolledClothIcon,
  Gears: gearsIcon,
  Padlock: padlockIcon,
  Furnace: furnaceIcon,
  Miner: minerIcon,
} as const;

export const SkillIcon: Record<SkillName, string> = {
  gathering: Icons.Scythe,
  logging: Icons.AxeInStump,
  mining: Icons.Miner,
  skinning: Icons.AnimalHide,
  fishing: Icons.Salmon,
  hand: Icons.RolledCloth,
  cooking: Icons.CampCookingPot,
  smelting: Icons.GoldBar,
  crafting: Icons.StoneCrafting,
};

const DEFAULT_ENEMY_ICON = Icons.Enemy;
const DEFAULT_ENEMY_TINT = 0x60a5fa;
const DEFAULT_ITEM_ICON = Icons.Artifact;
const DEFAULT_ITEM_BORDER_COLOR = '#f8fafc';
const RECIPE_PAGE_TINT = '#22c55e';
const DEFAULT_EQUIPPABLE_TINT = '#cbd5e1';

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

const EQUIPPABLE_ROLE_BY_SLOT: Record<EquipmentSlot, EquippableRole> = {
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
};

const EQUIPPABLE_TONE_BY_ROLE: Record<EquippableRole, EquippableTone> = {
  weapon: 'light',
  shield: 'mid',
  head: 'mid',
  cloak: 'dark',
  jewelry: 'accent',
  utility: 'dark',
  focus: 'accent',
};

const SET_EQUIPPABLE_TINTS: Record<SetEquippableFamily, EquippableTintScale> = {
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
  'bell-pepper': '#22c55e',
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

export const ItemIcon: Record<EquipmentSlot, string> = {
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

const ItemKindIcon: Record<
  Exclude<ReturnType<typeof getItemCategory>, 'resource'>,
  string
> = {
  weapon: Icons.Weapon,
  armor: DEFAULT_ITEM_ICON,
  artifact: DEFAULT_ITEM_ICON,
  consumable: Icons.Consumable,
};

export function enemyIconFor(
  enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string,
) {
  const enemyTypeId = typeof enemy === 'string' ? enemy : enemy.enemyTypeId;
  const configured = enemyTypeId ? getEnemyConfig(enemyTypeId) : undefined;
  return configured?.icon ?? DEFAULT_ENEMY_ICON;
}

export function enemyTint(enemy: Pick<Enemy, 'enemyTypeId' | 'name'> | string) {
  const enemyTypeId = typeof enemy === 'string' ? enemy : enemy.enemyTypeId;
  const configured = enemyTypeId ? getEnemyConfig(enemyTypeId) : undefined;
  return configured?.tint ?? DEFAULT_ENEMY_TINT;
}

export function iconForItem(item?: Item, slot?: EquipmentSlot) {
  if (item && isRecipePage(item)) {
    return resolveIconAsset(Icons.ScrollQuill);
  }

  const slotIcon = slot ? ItemIcon[slot] : undefined;
  const itemSlotIcon = item?.slot ? ItemIcon[item.slot] : undefined;
  const configuredItem = item ? getItemConfig(item) : undefined;
  if (item?.icon) return resolveIconAsset(item.icon);
  const configuredItemIcon =
    item && (item.tags ?? []).includes(GAME_TAGS.item.totem)
      ? Icons.Totem
      : configuredItem?.icon;
  const category = item ? getItemCategory(item) : undefined;
  const kindIcon =
    category && category !== 'resource' ? ItemKindIcon[category] : undefined;

  return resolveIconAsset(
    configuredItemIcon ??
      itemSlotIcon ??
      kindIcon ??
      slotIcon ??
      DEFAULT_ITEM_ICON,
  );
}

export function structureIconFor(structure: StructureType) {
  return getStructureConfig(structure).icon;
}

export function structureTint(structure: StructureType) {
  return getStructureConfig(structure).tint;
}

export function itemBorderColor(item?: Item) {
  if (!item) return rarityColor('common');
  return isEquippableItemCategory(getItemCategory(item))
    ? rarityColor(item.rarity)
    : DEFAULT_ITEM_BORDER_COLOR;
}

export function itemTint(item?: Item) {
  if (!item) return rarityColor('common');
  if (isRecipePage(item)) return RECIPE_PAGE_TINT;

  const configuredItem = getItemConfig(item);
  if (configuredItem?.tint) return configuredItem.tint;

  return getFallbackItemTint(item) ?? DEFAULT_ITEM_BORDER_COLOR;
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

  if (hasGameTag(item, GAME_TAGS.item.wood)) return '#92400e';
  if (hasGameTag(item, GAME_TAGS.item.animalProduct)) return '#92400e';
  if (hasGameTag(item, GAME_TAGS.item.mana)) return '#a855f7';

  return DEFAULT_ITEM_BORDER_COLOR;
}

function getConsumableTint(item: Item) {
  if (item.itemKey && ITEM_TINT_BY_KEY[item.itemKey]) {
    return ITEM_TINT_BY_KEY[item.itemKey];
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
  if (prefix in SET_EQUIPPABLE_TINTS) {
    return prefix as SetEquippableFamily;
  }

  return undefined;
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
    hasGameTag(item, GAME_TAGS.item.mana) ||
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
    hasGameTag(item, GAME_TAGS.item.cloth) ||
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

function hasGameTag(item: Item, tag: GameTag) {
  return (item.tags ?? []).includes(tag);
}
