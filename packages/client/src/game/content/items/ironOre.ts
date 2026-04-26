import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const ironOreItemConfig: ItemConfig = {
  key: 'iron-ore',
  name: itemName('iron-ore'),
  icon: ContentIcons.Ore,
  tint: '#94a3b8',
  tier: 2,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [
    GAME_TAGS.item.gathered,
    GAME_TAGS.item.ore,
    GAME_TAGS.item.craftingMaterial,
  ],
};
