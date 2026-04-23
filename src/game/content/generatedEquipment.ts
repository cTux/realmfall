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

export const GENERATED_EQUIPMENT_CONFIGS: ItemConfig[] = [
  ...GENERATED_EQUIPMENT_FAMILIES.flatMap((family) => {
    if (!family.drop) {
      return [];
    }

    return [
      generated(
        family.drop.key,
        family.drop.slot,
        family.category,
        GENERATED_ICON_POOLS[family.familyKey],
        family.drop.generatedStats,
        family.occupiesOffhand,
        family.grantedAbilityPool as AbilityId[] | undefined,
      ),
    ];
  }),
];

function getGeneratedKeysForGroup(
  group: 'armor' | 'accessory' | 'weapon' | 'offhand',
) {
  return GENERATED_EQUIPMENT_FAMILIES.flatMap((family) =>
    family.group === group && family.drop ? [family.drop.key] : [],
  );
}

export const GENERATED_ARMOR_KEYS = getGeneratedKeysForGroup('armor');
export const GENERATED_ACCESSORY_KEYS = getGeneratedKeysForGroup('accessory');
export const GENERATED_WEAPON_KEYS = getGeneratedKeysForGroup('weapon');
export const GENERATED_OFFHAND_KEYS = getGeneratedKeysForGroup('offhand');
