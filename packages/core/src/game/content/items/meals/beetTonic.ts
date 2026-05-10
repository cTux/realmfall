import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const beetTonicItemConfig: ItemConfig = {
  key: 'beet-tonic',
  name: itemName('beet-tonic'),
  icon: ContentIcons.Beet,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 10,
  hunger: 26,
  thirst: 18,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
