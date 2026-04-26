import { GAME_TAGS } from './tags';
import {
  GENERATED_EQUIPMENT_FAMILIES,
  GENERATED_ICON_POOLS,
} from './generatedEquipmentFamilies';
import { EquipmentSlotId } from './ids';
import { itemName } from './i18n';
import type { ItemConfig } from './types';

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0');
}

const RING_CRAFT_SLOT_SPLIT = Math.ceil(
  GENERATED_EQUIPMENT_FAMILIES.filter(
    (family) =>
      family.familyKey === 'ring' && family.craft !== undefined,
  ).reduce(
    (total, family) => total + GENERATED_ICON_POOLS[family.familyKey].length,
    0,
  ) / 2,
);

let ringCraftIndex = 0;

export const CRAFTABLE_ICON_ITEM_CONFIGS: ItemConfig[] =
  GENERATED_EQUIPMENT_FAMILIES.flatMap((family) => {
    const craft = family.craft;

    if (!craft) {
      return [];
    }

    return GENERATED_ICON_POOLS[family.familyKey].map((icon, index) => {
      const isRingFamily = family.familyKey === 'ring';
      const craftSlot = isRingFamily
        ? ringCraftIndex < RING_CRAFT_SLOT_SPLIT
          ? EquipmentSlotId.RingLeft
          : EquipmentSlotId.RingRight
        : craft.slot;

      ringCraftIndex += isRingFamily ? 1 : 0;

      const ordinal = padIndex(index);
      return {
        key: `${craft.keyPrefix}-${ordinal}`,
        name: itemName(`${craft.keyPrefix}-${ordinal}`),
        slot: craftSlot,
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
