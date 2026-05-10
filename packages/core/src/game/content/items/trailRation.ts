import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const trailRationItemConfig: ItemConfig = {
  key: 'trail-ration',
  name: itemName('trail-ration'),
  icon: ContentIcons.ShinyApple,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 8,
  hunger: 12,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
