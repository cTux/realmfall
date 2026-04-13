import { HOME_SCROLL_ITEM_NAME } from '../../config';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const homeScrollItemConfig: ItemConfig = {
  key: 'home-scroll',
  name: HOME_SCROLL_ITEM_NAME,
  kind: 'consumable',
  icon: ContentIcons.TiedScroll,
  tint: '#a78bfa',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  dropChance: 0.04,
};
