import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const ironIngotItemConfig: ItemConfig = {
  key: 'iron-ingot',
  name: itemName('iron-ingot'),
  icon: ContentIcons.GoldBar,
  tint: '#f8fafc',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.craftingMaterial],
};
