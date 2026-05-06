import { itemName } from './i18n';
import type { AbilityId } from '../types';
import type { ItemConfig } from './types';
export { GENERATED_ICON_POOLS } from './generatedEquipmentFamilies';
import {
  GENERATED_EQUIPMENT_FAMILIES,
  GENERATED_ICON_POOLS,
} from './generatedEquipmentFamilies';

const generated = (
  key: string,
  slot: ItemConfig['slot'],
  category: NonNullable<ItemConfig['category']>,
  iconPool: readonly string[],
  generatedStats: NonNullable<ItemConfig['generatedStats']>,
  occupiesOffhand = false,
  grantedAbilityPool: AbilityId[] = [],
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
  grantedAbilityPool,
});

function getGeneratedFamilyDropEntries(
  family: (typeof GENERATED_EQUIPMENT_FAMILIES)[number],
) {
  if (family.drop) {
    return [
      {
        key: family.drop.key,
        slot: family.drop.slot,
        generatedStats: family.drop.generatedStats,
      },
    ];
  }

  return (family.ring?.mirroredDropVariants ?? []).map((variant) => ({
    key: variant.key,
    slot: variant.slot,
    generatedStats: family.ring!.generatedStats,
  }));
}

export const GENERATED_EQUIPMENT_CONFIGS: ItemConfig[] = [
  ...GENERATED_EQUIPMENT_FAMILIES.flatMap((family) =>
    getGeneratedFamilyDropEntries(family).map((drop) =>
      generated(
        drop.key,
        drop.slot,
        family.category,
        GENERATED_ICON_POOLS[family.familyKey],
        drop.generatedStats,
        family.occupiesOffhand,
        family.grantedAbilityPool as AbilityId[] | undefined,
      ),
    ),
  ),
];

function getGeneratedKeysForGroup(
  group: 'armor' | 'accessory' | 'weapon' | 'offhand',
) {
  return GENERATED_EQUIPMENT_FAMILIES.flatMap((family) =>
    family.group === group
      ? getGeneratedFamilyDropEntries(family).map((drop) => drop.key)
      : [],
  );
}

export const GENERATED_ARMOR_KEYS = getGeneratedKeysForGroup('armor');
export const GENERATED_ACCESSORY_KEYS = getGeneratedKeysForGroup('accessory');
export const GENERATED_WEAPON_KEYS = getGeneratedKeysForGroup('weapon');
export const GENERATED_OFFHAND_KEYS = getGeneratedKeysForGroup('offhand');
