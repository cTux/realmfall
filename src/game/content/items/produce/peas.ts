import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const peasItemConfig: ItemConfig = {
  key: 'peas',
  name: itemName('peas'),
  icon: ContentIcons.Peas,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 11,
  thirst: 3,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.gathered, GAME_TAGS.item.craftingMaterial],
};

