import {
  EQUIPMENT_SLOTS,
  type EquipmentSlot,
} from '@realmfall/core/game/stateTypes';
import {
  buildItemFromConfig,
  getItemConfigByKey,
  ITEM_CONFIGS,
} from '@realmfall/core/game/content/items';

export const CRAFTING_SLOT_FILTERS = EQUIPMENT_SLOTS;

const CRAFTING_SLOT_FILTER_ICON_CHOICES: Partial<
  Record<EquipmentSlot, readonly string[]>
> = {
  bracers: ['icon-bracers-01', 'icon-bracers-02'],
  belt: ['icon-belt-01', 'icon-belt-02', 'icon-belt-03'],
  cloak: ['icon-cloak-01', 'icon-cloak-02', 'icon-cloak-03'],
};

export function buildCraftingSlotFilterPreviewItems() {
  const map = new Map<EquipmentSlot, ReturnType<typeof buildItemFromConfig>>();

  for (const slot of CRAFTING_SLOT_FILTERS) {
    const preferred = CRAFTING_SLOT_FILTER_ICON_CHOICES[slot]
      ?.map((itemKey) => getItemConfigByKey(itemKey))
      .filter(
        (
          config,
        ): config is Exclude<
          ReturnType<typeof getItemConfigByKey>,
          undefined
        > => config !== undefined,
      );
    const slotItemConfigs =
      preferred && preferred.length > 0
        ? preferred
        : ITEM_CONFIGS.filter((config) => config.slot === slot);

    if (slotItemConfigs.length === 0) continue;

    const seed = [...slot].reduce(
      (total, char) => (total * 31 + char.charCodeAt(0)) % 997,
      17,
    );
    const chosenConfig =
      slotItemConfigs[Math.abs(seed) % slotItemConfigs.length];

    map.set(slot, buildItemFromConfig(chosenConfig.key));
  }

  return map;
}

export const CRAFTING_SLOT_FILTER_PREVIEW_ITEMS =
  buildCraftingSlotFilterPreviewItems();
