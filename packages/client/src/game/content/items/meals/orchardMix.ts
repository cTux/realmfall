import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const orchardMixItemConfig: ItemConfig = {
  key: 'orchard-mix',
  name: itemName('orchard-mix'),
  icon: ContentIcons.ShinyApple,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 9,
  hunger: 30,
  thirst: 18,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
