import { itemName } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { ItemConfig } from '../types';

export const leatherScrapsItemConfig: ItemConfig = {
  key: 'leather-scraps',
  name: itemName('leather-scraps'),
  icon: ContentIcons.AnimalHide,
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 0,
  maxHp: 0,
  healing: 0,
  hunger: 0,
  defaultQuantity: 1,
  tags: [
    GAME_TAGS.item.animalProduct,
    GAME_TAGS.item.prospectable,
    GAME_TAGS.item.craftingMaterial,
  ],
};
