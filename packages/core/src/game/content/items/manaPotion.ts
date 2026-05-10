import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { ItemConfig } from '../types';

export const manaPotionItemConfig: ItemConfig = {
  key: ItemId.ManaPotion,
  name: itemName(ItemId.ManaPotion),
  icon: ContentIcons.MagicPotion,
  tint: '#60a5fa',
  category: 'consumable',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  dropChance: 0.14,
};
