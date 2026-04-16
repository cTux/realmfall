import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const lemonPeaMixItemConfig: ItemConfig = {
  key: 'lemon-pea-mix',
  name: itemName('lemon-pea-mix'),
  icon: ContentIcons.Lemon,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 8,
  hunger: 32,
  thirst: 14,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

