import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const ironIngotItemConfig: ItemConfig = {
  key: 'iron-ingot',
  name: itemName('iron-ingot'),
  icon: ContentIcons.GoldBar,
  tint: '#cbd5e1',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
