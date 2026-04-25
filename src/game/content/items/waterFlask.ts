import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const waterFlaskItemConfig: ItemConfig = {
  key: 'water-flask',
  name: itemName('water-flask'),
  icon: ContentIcons.Consumable,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  thirst: 24,
  defaultQuantity: 1,
  dropChance: 0.26,
  tags: [GAME_TAGS.item.crafted],
};
