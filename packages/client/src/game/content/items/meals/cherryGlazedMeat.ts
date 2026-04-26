import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const cherryGlazedMeatItemConfig: ItemConfig = {
  key: 'cherry-glazed-meat',
  name: itemName('cherry-glazed-meat'),
  icon: ContentIcons.Cherry,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 18,
  hunger: 50,
  thirst: 10,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
