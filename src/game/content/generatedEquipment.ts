import { itemName } from './i18n';
export { GENERATED_ICON_POOLS } from './generatedIconPools';
import { GENERATED_ICON_POOLS } from './generatedIconPools';
import { EquipmentSlotId } from './ids';
import type { ItemConfig } from './types';

const generated = (
  key: string,
  slot: ItemConfig['slot'],
  category: NonNullable<ItemConfig['category']>,
  iconPool: readonly string[],
  generatedStats: NonNullable<ItemConfig['generatedStats']>,
  occupiesOffhand = false,
): ItemConfig => ({
  key,
  name: itemName(key),
  slot,
  icon: iconPool[0] ?? '',
  iconPool: [...iconPool],
  category,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  thirst: 0,
  occupiesOffhand,
  generatedStats,
});

export const GENERATED_EQUIPMENT_CONFIGS: ItemConfig[] = [
  generated(
    'generated-helmet',
    EquipmentSlotId.Head,
    'armor',
    GENERATED_ICON_POOLS.helmet,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-shoulders',
    EquipmentSlotId.Shoulders,
    'armor',
    GENERATED_ICON_POOLS.shoulders,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-chest',
    EquipmentSlotId.Chest,
    'armor',
    GENERATED_ICON_POOLS.chest,
    {
      baseDefense: 2,
      defensePerTier: 1,
      baseMaxHp: 2,
      maxHpPerTier: 2,
    },
  ),
  generated(
    'generated-bracers',
    EquipmentSlotId.Bracers,
    'armor',
    GENERATED_ICON_POOLS.bracers,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 0,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-gloves',
    EquipmentSlotId.Hands,
    'armor',
    GENERATED_ICON_POOLS.gloves,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 0,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-belt',
    EquipmentSlotId.Belt,
    'armor',
    GENERATED_ICON_POOLS.belt,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-leggings',
    EquipmentSlotId.Legs,
    'armor',
    GENERATED_ICON_POOLS.leggings,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-boots',
    EquipmentSlotId.Feet,
    'armor',
    GENERATED_ICON_POOLS.feet,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 0,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-cloak',
    EquipmentSlotId.Cloak,
    'armor',
    GENERATED_ICON_POOLS.cloak,
    {
      basePower: 1,
      powerPerTier: 1,
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
      randomMainStatPool: ['power', 'defense', 'maxHp'],
      randomMainStatCount: 2,
    },
  ),
  generated(
    'generated-ring-left',
    EquipmentSlotId.RingLeft,
    'artifact',
    GENERATED_ICON_POOLS.ring,
    {
      basePower: 1,
      powerPerTier: 1,
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
      randomMainStatPool: ['power', 'defense', 'maxHp'],
      randomMainStatCount: 2,
    },
  ),
  generated(
    'generated-ring-right',
    EquipmentSlotId.RingRight,
    'artifact',
    GENERATED_ICON_POOLS.ring,
    {
      basePower: 1,
      powerPerTier: 1,
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
      randomMainStatPool: ['power', 'defense', 'maxHp'],
      randomMainStatCount: 2,
    },
  ),
  generated(
    'generated-necklace',
    EquipmentSlotId.Amulet,
    'artifact',
    GENERATED_ICON_POOLS.necklace,
    {
      basePower: 1,
      powerPerTier: 1,
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 2,
      maxHpPerTier: 2,
      randomMainStatPool: ['power', 'defense', 'maxHp'],
      randomMainStatCount: 2,
    },
  ),
  generated(
    'generated-axe',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.axe,
    {
      basePower: 3,
      powerPerTier: 2,
    },
  ),
  generated(
    'generated-sword',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.sword,
    {
      basePower: 3,
      powerPerTier: 2,
    },
  ),
  generated(
    'generated-mace',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.mace,
    {
      basePower: 3,
      powerPerTier: 2,
    },
  ),
  generated(
    'generated-dagger',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.dagger,
    {
      basePower: 2,
      powerPerTier: 2,
    },
  ),
  generated(
    'generated-wand',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.wand,
    {
      basePower: 4,
      powerPerTier: 2,
    },
  ),
  generated(
    'generated-offhand-dagger',
    EquipmentSlotId.Offhand,
    'weapon',
    GENERATED_ICON_POOLS.dagger,
    {
      basePower: 2,
      powerPerTier: 1,
    },
  ),
  generated(
    'generated-magical-sphere',
    EquipmentSlotId.Offhand,
    'artifact',
    GENERATED_ICON_POOLS.magicalSphere,
    {
      baseDefense: 1,
      defensePerTier: 1,
      baseMaxHp: 1,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-shield',
    EquipmentSlotId.Offhand,
    'armor',
    GENERATED_ICON_POOLS.shield,
    {
      baseDefense: 2,
      defensePerTier: 2,
      baseMaxHp: 1,
      maxHpPerTier: 1,
    },
  ),
  generated(
    'generated-two-handed-sword',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.twoHandedSword,
    {
      basePower: 6,
      powerPerTier: 4,
    },
    true,
  ),
  generated(
    'generated-two-handed-axe',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.twoHandedAxe,
    {
      basePower: 6,
      powerPerTier: 4,
    },
    true,
  ),
  generated(
    'generated-two-handed-mace',
    EquipmentSlotId.Weapon,
    'weapon',
    GENERATED_ICON_POOLS.twoHandedMace,
    {
      basePower: 6,
      powerPerTier: 4,
    },
    true,
  ),
];

export const GENERATED_ARMOR_KEYS = [
  'generated-helmet',
  'generated-shoulders',
  'generated-chest',
  'generated-bracers',
  'generated-gloves',
  'generated-belt',
  'generated-leggings',
  'generated-boots',
  'generated-cloak',
] as const;

export const GENERATED_ACCESSORY_KEYS = [
  'generated-ring-left',
  'generated-ring-right',
  'generated-necklace',
] as const;

export const GENERATED_WEAPON_KEYS = [
  'generated-axe',
  'generated-sword',
  'generated-mace',
  'generated-dagger',
  'generated-wand',
  'generated-two-handed-sword',
  'generated-two-handed-axe',
  'generated-two-handed-mace',
] as const;

export const GENERATED_OFFHAND_KEYS = [
  'generated-shield',
  'generated-offhand-dagger',
  'generated-magical-sphere',
] as const;
