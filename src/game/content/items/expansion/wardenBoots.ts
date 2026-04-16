import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const wardenBootsItemConfig = createExpansionItemConfig({
  key: 'warden-boots',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 3,
  maxHp: 3,
});
