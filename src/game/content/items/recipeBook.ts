import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';

export const recipeBookItemConfig: ItemConfig = {
  key: 'recipe-book',
  name: itemName('recipe-book'),
  kind: 'resource',
  icon: ContentIcons.BookCover,
  tint: '#c084fc',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
};
