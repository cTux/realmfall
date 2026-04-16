import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const lemonCutletItemConfig: ItemConfig = {
  key: 'lemon-cutlet',
  name: itemName('lemon-cutlet'),
  icon: ContentIcons.Lemon,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 17,
  hunger: 50,
  thirst: 12,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

