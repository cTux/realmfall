import { GAME_TAGS } from './tags';
import {
  GENERATED_EQUIPMENT_FAMILIES,
  GENERATED_ICON_POOLS,
  type GeneratedCraftDefinition,
  type GeneratedEquipmentFamilyDefinition,
} from './generatedEquipmentFamilies';
import { itemName } from './i18n';
import type { ItemConfig } from './types';

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0');
}

export interface CraftableIconItemEntry {
  config: ItemConfig;
  craft: GeneratedCraftDefinition;
  family: GeneratedEquipmentFamilyDefinition;
}

export const CRAFTABLE_ICON_ITEM_ENTRIES: CraftableIconItemEntry[] =
  GENERATED_EQUIPMENT_FAMILIES.flatMap((family) => {
    const craft = family.craft;

    if (!craft) {
      return [];
    }

    return GENERATED_ICON_POOLS[family.familyKey].map((icon, index) => {
      const slot =
        resolveMirroredCraftSlot(
          family.ring?.craftedSlotDistribution,
          index,
          GENERATED_ICON_POOLS[family.familyKey].length,
        ) ?? craft.slot;
      const ordinal = padIndex(index);

      return {
        family,
        craft,
        config: {
          key: `${craft.keyPrefix}-${ordinal}`,
          name: itemName(`${craft.keyPrefix}-${ordinal}`),
          slot,
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
        } satisfies ItemConfig,
      };
    });
  });

function resolveMirroredCraftSlot(
  distribution:
    | NonNullable<
        GeneratedEquipmentFamilyDefinition['ring']
      >['craftedSlotDistribution']
    | undefined,
  index: number,
  itemCount: number,
) {
  if (!distribution || distribution.slots.length === 0 || itemCount <= 0) {
    return undefined;
  }

  const baseCount = Math.floor(itemCount / distribution.slots.length);
  const remainder = itemCount % distribution.slots.length;
  let remainingIndex = index;

  for (
    let slotIndex = 0;
    slotIndex < distribution.slots.length;
    slotIndex += 1
  ) {
    const slotCount =
      baseCount +
      (distribution.oddCountBias === 'first' && slotIndex < remainder ? 1 : 0);
    if (remainingIndex < slotCount) {
      return distribution.slots[slotIndex];
    }
    remainingIndex -= slotCount;
  }

  return distribution.slots[distribution.slots.length - 1];
}

export const CRAFTABLE_ICON_ITEM_CONFIGS: ItemConfig[] =
  CRAFTABLE_ICON_ITEM_ENTRIES.map(({ config }) => config);
