import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const carrotItemConfig: ItemConfig = {
  key: 'carrot',
  name: itemName('carrot'),
  icon: ContentIcons.Carrot,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 12,
  thirst: 3,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};
