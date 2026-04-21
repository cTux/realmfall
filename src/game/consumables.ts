import { ItemId } from './content/ids';
import { hasItemTag } from './content/items';
import { GAME_TAGS } from './content/tags';
import type { Item } from './types';

export const MINIMUM_FOOD_RESTORE_PERCENT = 10;
export const POTION_RESTORE_PERCENT = 35;

interface ConsumableRestoreProfile {
  healingPercent: number;
  manaPercent: number;
}

type ConsumableRestoreItem = Pick<
  Item,
  'healing' | 'hunger' | 'itemKey' | 'name' | 'slot' | 'tags' | 'thirst'
>;

export function getConsumableRestoreProfile(
  item: ConsumableRestoreItem,
): ConsumableRestoreProfile {
  if (item.itemKey === ItemId.HealthPotion) {
    return {
      healingPercent: POTION_RESTORE_PERCENT,
      manaPercent: 0,
    };
  }

  if (item.itemKey === ItemId.ManaPotion) {
    return {
      healingPercent: 0,
      manaPercent: POTION_RESTORE_PERCENT,
    };
  }

  if (hasItemTag(item, GAME_TAGS.item.food)) {
    const restorePercent = Math.max(MINIMUM_FOOD_RESTORE_PERCENT, item.healing);

    return {
      healingPercent: restorePercent,
      manaPercent: restorePercent,
    };
  }

  return {
    healingPercent: 0,
    manaPercent: 0,
  };
}

export function resolvePercentRestoreAmount(maxValue: number, percent: number) {
  if (percent <= 0) return 0;
  return Math.max(1, Math.ceil(maxValue * (percent / 100)));
}
