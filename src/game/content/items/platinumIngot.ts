import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const platinumIngotItemConfig: ItemConfig = {
  key: 'platinum-ingot',
  name: itemName('platinum-ingot'),
  icon: ContentIcons.GoldBar,
  tint: '#f5f3ff',
  tier: 4,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
