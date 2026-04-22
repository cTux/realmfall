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

export type ConsumableEffectDescriptor =
  | { kind: 'foodRestorePercent'; amount: number }
  | { kind: 'healingPercent'; amount: number }
  | { kind: 'hunger'; amount: number }
  | { kind: 'manaPercent'; amount: number }
  | { kind: 'thirst'; amount: number }
  | { kind: 'homeScroll' };

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

export function getConsumableEffectDescriptors(
  item: ConsumableRestoreItem,
): ConsumableEffectDescriptor[] {
  if (item.itemKey === ItemId.HomeScroll) {
    return [{ kind: 'homeScroll' }];
  }

  const restoreProfile = getConsumableRestoreProfile(item);
  const descriptors: ConsumableEffectDescriptor[] = [];

  if (
    restoreProfile.healingPercent > 0 &&
    restoreProfile.healingPercent === restoreProfile.manaPercent
  ) {
    descriptors.push({
      kind: 'foodRestorePercent',
      amount: restoreProfile.healingPercent,
    });
  } else {
    if (restoreProfile.healingPercent > 0) {
      descriptors.push({
        kind: 'healingPercent',
        amount: restoreProfile.healingPercent,
      });
    }

    if (restoreProfile.manaPercent > 0) {
      descriptors.push({
        kind: 'manaPercent',
        amount: restoreProfile.manaPercent,
      });
    }
  }

  if (item.hunger > 0) {
    descriptors.push({ kind: 'hunger', amount: item.hunger });
  }

  if ((item.thirst ?? 0) > 0) {
    descriptors.push({ kind: 'thirst', amount: item.thirst ?? 0 });
  }

  return descriptors;
}
