import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const leatherScrapsItemConfig: ItemConfig = {
  key: 'leather-scraps',
  name: itemName('leather-scraps'),
  icon: ContentIcons.AnimalHide,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
