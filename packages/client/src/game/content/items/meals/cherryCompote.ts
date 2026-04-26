import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const cherryCompoteItemConfig: ItemConfig = {
  key: 'cherry-compote',
  name: itemName('cherry-compote'),
  icon: ContentIcons.Cherry,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 10,
  hunger: 28,
  thirst: 16,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
