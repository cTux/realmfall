import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const rootMedleyItemConfig: ItemConfig = {
  key: 'root-medley',
  name: itemName('root-medley'),
  icon: ContentIcons.CampCookingPot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 6,
  hunger: 38,
  thirst: 8,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
