import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const herbRoastedMeatItemConfig: ItemConfig = {
  key: 'herb-roasted-meat',
  name: itemName('herb-roasted-meat'),
  icon: ContentIcons.Steak,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 16,
  hunger: 54,
  thirst: 8,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

