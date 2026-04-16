import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossBootsItemConfig = createExpansionItemConfig({
  key: 'moss-boots',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 4,
  maxHp: 4,
});
