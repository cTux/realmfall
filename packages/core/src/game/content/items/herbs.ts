import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import type { ItemConfig } from '../types';
import { GAME_TAGS } from '../tags';

export const herbsItemConfig: ItemConfig = {
  key: 'herbs',
  name: itemName('herbs'),
  icon: ContentIcons.HerbsBundle,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};
