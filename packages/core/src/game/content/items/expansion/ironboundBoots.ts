import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ironboundBootsItemConfig = createExpansionItemConfig({
  key: 'ironbound-boots',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 2,
  maxHp: 2,
});
