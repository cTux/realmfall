import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const goldItemConfig: ItemConfig = {
  key: 'gold',
  name: 'Gold',
  kind: 'resource',
  icon: ContentIcons.Coins,
  tint: '#fbbf24',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
