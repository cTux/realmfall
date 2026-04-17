import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const cherryAppleCrispItemConfig: ItemConfig = {
  key: 'cherry-apple-crisp',
  name: itemName('cherry-apple-crisp'),
  icon: ContentIcons.Cherry,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 12,
  hunger: 34,
  thirst: 14,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
