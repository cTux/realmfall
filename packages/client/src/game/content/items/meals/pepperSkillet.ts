import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const pepperSkilletItemConfig: ItemConfig = {
  key: 'pepper-skillet',
  name: itemName('pepper-skillet'),
  icon: ContentIcons.FriedFish,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 8,
  hunger: 36,
  thirst: 6,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
