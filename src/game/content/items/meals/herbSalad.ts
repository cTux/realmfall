import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const herbSaladItemConfig: ItemConfig = {
  key: 'herb-salad',
  name: itemName('herb-salad'),
  icon: ContentIcons.HerbsBundle,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 6,
  hunger: 30,
  thirst: 12,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
