import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const flaxItemConfig: ItemConfig = {
  key: ItemId.Flax,
  name: itemName(ItemId.Flax),
  icon: ContentIcons.Flax,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [
    GAME_TAGS.item.gathered,
    GAME_TAGS.item.craftingMaterial,
    GAME_TAGS.item.cloth,
  ],
};
