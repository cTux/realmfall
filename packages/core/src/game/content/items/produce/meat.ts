import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const meatItemConfig: ItemConfig = {
  key: 'meat',
  name: itemName('meat'),
  icon: ContentIcons.Steak,
  category: 'resource',
  tier: 2,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  thirst: 0,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.animalProduct, GAME_TAGS.item.craftingMaterial],
};
