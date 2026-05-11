import { getItemCategory, type ItemCategory } from '../game/content/items';
import type { EquipmentSlotView, ItemView } from '../game/stateTypes';
import { t } from './index';

export function formatEquipmentSlotLabel(slot: EquipmentSlotView) {
  return t(`ui.equipmentSlot.${slot}.label`);
}

export function formatItemLabel(
  item: Pick<ItemView, 'name'> &
    Partial<
      Pick<
        ItemView,
        | 'itemKey'
        | 'slot'
        | 'recipeId'
        | 'power'
        | 'defense'
        | 'maxHp'
        | 'healing'
        | 'hunger'
        | 'thirst'
        | 'tags'
      >
    >,
) {
  return formatItemKindLabel(getItemCategory(item));
}

function formatItemKindLabel(kind: ItemCategory) {
  return t(`ui.itemKind.${kind}.label`);
}
