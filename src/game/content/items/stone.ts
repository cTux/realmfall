import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const stoneItemConfig: ItemConfig = {
  key: 'stone',
  name: 'Stone',
  kind: 'resource',
  icon: ContentIcons.StoneBlock,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
