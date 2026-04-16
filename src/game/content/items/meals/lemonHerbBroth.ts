import { itemName } from '../../i18n';
import { ContentIcons } from '../../icons';
import type { ItemConfig } from '../../types';
import { GAME_TAGS } from '../../tags';

export const lemonHerbBrothItemConfig: ItemConfig = {
  key: 'lemon-herb-broth',
  name: itemName('lemon-herb-broth'),
  icon: ContentIcons.CampCookingPot,
  tier: 2,
  rarity: 'uncommon',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 11,
  hunger: 28,
  thirst: 20,
  defaultQuantity: 1,
  tags: [GAME_TAGS.item.crafted],
};

