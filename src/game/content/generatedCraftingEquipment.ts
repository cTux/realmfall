import { GAME_TAGS } from './tags';
import {
  GENERATED_EQUIPMENT_FAMILIES,
  GENERATED_ICON_POOLS,
} from './generatedEquipmentFamilies';
import { itemName } from './i18n';
import type { ItemConfig } from './types';

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0');
}

export const CRAFTABLE_ICON_ITEM_CONFIGS: ItemConfig[] =
  GENERATED_EQUIPMENT_FAMILIES.flatMap((family) => {
    const craft = family.craft;

    if (!craft) {
      return [];
    }

    return GENERATED_ICON_POOLS[family.familyKey].map((icon, index) => {
      const ordinal = padIndex(index);
      return {
        key: `${craft.keyPrefix}-${ordinal}`,
        name: itemName(`${craft.keyPrefix}-${ordinal}`),
        slot: craft.slot,
        icon,
        category: family.category,
        tier: craft.tier,
        rarity: craft.rarity,
        power: craft.power,
        defense: craft.defense,
        maxHp: craft.maxHp,
        healing: 0,
        hunger: 0,
        thirst: 0,
        occupiesOffhand: family.occupiesOffhand,
        grantedAbilityPool: family.grantedAbilityPool,
        tags: [GAME_TAGS.item.crafted],
      } satisfies ItemConfig;
    });
  });
