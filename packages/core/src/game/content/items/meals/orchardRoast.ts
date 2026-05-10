import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const orchardRoastItemConfig: ItemConfig = {
  key: 'orchard-roast',
  name: itemName('orchard-roast'),
  icon: ContentIcons.ShinyApple,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 19,
  hunger: 54,
  thirst: 12,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};
