import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const cookedFishItemConfig: ItemConfig = {
  key: 'cooked-fish',
  name: itemName('cooked-fish'),
  kind: 'consumable',
  icon: ContentIcons.FriedFish,
  tint: '#f59e0b',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 4,
  hunger: 24,
  defaultQuantity: 1,
};
