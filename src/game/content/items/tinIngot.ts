import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const tinIngotItemConfig: ItemConfig = {
  key: 'tin-ingot',
  name: itemName('tin-ingot'),
  icon: ContentIcons.GoldBar,
  tint: '#f3f4f6',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
