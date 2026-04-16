import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const copperIngotItemConfig: ItemConfig = {
  key: 'copper-ingot',
  name: itemName('copper-ingot'),
  icon: ContentIcons.GoldBar,
  tint: '#fb923c',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
