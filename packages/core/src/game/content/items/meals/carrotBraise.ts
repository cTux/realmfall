import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const carrotBraiseItemConfig: ItemConfig = {
  key: 'carrot-braise',
  name: itemName('carrot-braise'),
  icon: ContentIcons.Carrot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 8,
  hunger: 34,
  thirst: 8,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
