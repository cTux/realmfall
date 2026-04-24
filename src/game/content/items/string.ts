import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { ItemId } from '../ids';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const stringItemConfig: ItemConfig = {
  key: ItemId.String,
  name: itemName(ItemId.String),
  icon: ContentIcons.SewingString,
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
