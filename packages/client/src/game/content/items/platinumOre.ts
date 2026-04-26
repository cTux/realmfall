import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const platinumOreItemConfig: ItemConfig = {
  key: 'platinum-ore',
  name: itemName('platinum-ore'),
  icon: ContentIcons.Ore,
  tint: '#c084fc',
  tier: 4,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.ore, GAME_TAGS.item.craftingMaterial],
};
