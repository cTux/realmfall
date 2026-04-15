import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const coalItemConfig: ItemConfig = {
  key: 'coal',
  name: itemName('coal'),
  icon: ContentIcons.StonePile,
  tint: '#475569',
  tier: 2,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
