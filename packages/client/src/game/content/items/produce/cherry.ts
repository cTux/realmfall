import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const cherryItemConfig: ItemConfig = {
  key: 'cherry',
  name: itemName('cherry'),
  icon: ContentIcons.Cherry,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 2,
  hunger: 8,
  thirst: 6,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};
