import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const valeLeggingsItemConfig = createExpansionItemConfig({
  key: 'vale-leggings',
  slot: EquipmentSlotId.Legs,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 1,
  maxHp: 1,
});
