import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const copperOreItemConfig: ItemConfig = {
  key: 'copper-ore',
  name: itemName('copper-ore'),
  icon: ContentIcons.Ore,
  tint: '#f59e0b',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
