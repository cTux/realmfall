import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const ironChunksItemConfig: ItemConfig = {
  key: 'iron-chunks',
  name: itemName('iron-chunks'),
  icon: ContentIcons.StonePile,
  tint: '#94a3b8',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
