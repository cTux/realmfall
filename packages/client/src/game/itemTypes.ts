import type { GameTag } from './content/tags';
import type { AbilityId } from './abilityTypes';
import { EquipmentSlotId } from './content/ids';
import type { EquipmentSlotValue, ItemKey } from './content/ids';

export const RARITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const;

export type ItemRarity = (typeof RARITY_ORDER)[number];
export type EnemyRarity = ItemRarity;
export type MainItemStatKey = 'power' | 'defense' | 'maxHp';
export type SecondaryStatKey =
  | 'attackSpeed'
  | 'bonusExperience'
  | 'criticalStrikeChance'
  | 'criticalStrikeDamage'
  | 'lifestealChance'
  | 'lifestealAmount'
  | 'dodgeChance'
  | 'blockChance'
  | 'suppressDamageChance'
  | 'suppressDamageReduction'
  | 'suppressDebuffChance'
  | 'bleedChance'
  | 'poisonChance'
  | 'burningChance'
  | 'chillingChance'
  | 'powerBuffChance'
  | 'frenzyBuffChance';

export interface ItemSecondaryStat {
  key: SecondaryStatKey;
  value: number;
}

export type EquipmentSlot = EquipmentSlotValue;

export interface Item {
  id: string;
  itemKey?: ItemKey;
  tags?: GameTag[];
  recipeId?: string;
  locked?: boolean;
  slot?: EquipmentSlot;
  icon?: string;
  tint?: string;
  name: string;
  quantity: number;
  tier: number;
  rarity: ItemRarity;
  requiredLevel?: number;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
  thirst?: number;
  secondaryStatCapacity?: number;
  secondaryStats?: ItemSecondaryStat[];
  reforgedSecondaryStatIndex?: number;
  enchantedSecondaryStatIndex?: number;
  corrupted?: boolean;
  grantedAbilityId?: AbilityId;
}

export type Equipment = Partial<Record<EquipmentSlot, Item>>;

export interface TownStockEntry {
  item: Item;
  price: number;
}

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  EquipmentSlotId.Weapon,
  EquipmentSlotId.Offhand,
  EquipmentSlotId.Head,
  EquipmentSlotId.Shoulders,
  EquipmentSlotId.Chest,
  EquipmentSlotId.Bracers,
  EquipmentSlotId.Hands,
  EquipmentSlotId.Belt,
  EquipmentSlotId.Legs,
  EquipmentSlotId.Feet,
  EquipmentSlotId.RingLeft,
  EquipmentSlotId.RingRight,
  EquipmentSlotId.Amulet,
  EquipmentSlotId.Cloak,
];
