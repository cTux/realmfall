import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';
import { GAME_TAGS } from '../tags';

export const appleItemConfig: ItemConfig = {
  key: 'apple',
  name: itemName('apple'),
  icon: ContentIcons.ShinyApple,
  tier: 2,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 6,
  hunger: 20,
  thirst: 4,
  defaultQuantity: 1,
  dropChance: 0.22,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};
