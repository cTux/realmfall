import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const garlicMeatSkewersItemConfig: ItemConfig = {
  key: 'garlic-meat-skewers',
  name: itemName('garlic-meat-skewers'),
  icon: ContentIcons.Steak,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 17,
  hunger: 52,
  thirst: 6,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

