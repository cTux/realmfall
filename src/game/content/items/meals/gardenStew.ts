import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const gardenStewItemConfig: ItemConfig = {
  key: 'garden-stew',
  name: itemName('garden-stew'),
  icon: ContentIcons.CampCookingPot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 8,
  hunger: 42,
  thirst: 10,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

