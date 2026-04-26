import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const garlicLeekSoupItemConfig: ItemConfig = {
  key: 'garlic-leek-soup',
  name: itemName('garlic-leek-soup'),
  icon: ContentIcons.CampCookingPot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 10,
  hunger: 34,
  thirst: 14,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
