import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const meatAndPeasBraiseItemConfig: ItemConfig = {
  key: 'meat-and-peas-braise',
  name: itemName('meat-and-peas-braise'),
  icon: ContentIcons.Peas,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 18,
  hunger: 56,
  thirst: 10,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
