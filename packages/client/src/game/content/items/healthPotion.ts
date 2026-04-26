import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import type { ItemConfig } from '../types';

export const healthPotionItemConfig: ItemConfig = {
  key: ItemId.HealthPotion,
  name: itemName(ItemId.HealthPotion),
  icon: ContentIcons.MagicPotion,
  tint: '#f87171',
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
