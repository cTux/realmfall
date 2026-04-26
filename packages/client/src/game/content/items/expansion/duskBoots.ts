import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const duskBootsItemConfig = createExpansionItemConfig({
  key: 'dusk-boots',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 3,
  maxHp: 3,
});
