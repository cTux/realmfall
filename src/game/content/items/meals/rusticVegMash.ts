import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const rusticVegMashItemConfig: ItemConfig = {
  key: 'rustic-veg-mash',
  name: itemName('rustic-veg-mash'),
  icon: ContentIcons.CampCookingPot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 8,
  hunger: 36,
  thirst: 8,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

