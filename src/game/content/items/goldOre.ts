import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const goldOreItemConfig: ItemConfig = {
  key: 'gold-ore',
  name: itemName('gold-ore'),
  icon: ContentIcons.Ore,
  tint: '#fbbf24',
  tier: 3,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
