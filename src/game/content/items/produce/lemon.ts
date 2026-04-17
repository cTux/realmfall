import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const lemonItemConfig: ItemConfig = {
  key: 'lemon',
  name: itemName('lemon'),
  icon: ContentIcons.Lemon,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 1,
  hunger: 4,
  thirst: 8,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};
