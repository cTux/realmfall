import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const lockpickItemConfig: ItemConfig = {
  key: ItemId.Lockpick,
  name: itemName(ItemId.Lockpick),
  icon: ContentIcons.Lockpicks,
  tint: '#c084fc',
  category: 'consumable',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.chestOpener],
};
