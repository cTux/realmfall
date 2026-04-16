import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const valeBootsItemConfig = createExpansionItemConfig({
  key: 'vale-boots',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 1,
  maxHp: 1,
});
