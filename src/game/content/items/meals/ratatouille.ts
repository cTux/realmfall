import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const ratatouilleItemConfig: ItemConfig = {
  key: 'ratatouille',
  name: itemName('ratatouille'),
  icon: ContentIcons.Aubergine,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 12,
  hunger: 40,
  thirst: 10,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

