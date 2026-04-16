import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const goldIngotItemConfig: ItemConfig = {
  key: 'gold-ingot',
  name: itemName('gold-ingot'),
  icon: ContentIcons.GoldBar,
  tint: '#fef08a',
  tier: 3,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
