import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const tomatoItemConfig: ItemConfig = {
  key: 'tomato',
  name: itemName('tomato'),
  icon: ContentIcons.Tomato,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 1,
  hunger: 9,
  thirst: 7,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};

