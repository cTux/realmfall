import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const hunterStewItemConfig: ItemConfig = {
  key: 'hunter-stew',
  name: itemName('hunter-stew'),
  icon: ContentIcons.CampCookingPot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 20,
  hunger: 60,
  thirst: 12,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

