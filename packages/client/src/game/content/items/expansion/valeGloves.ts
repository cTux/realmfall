import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const valeGlovesItemConfig = createExpansionItemConfig({
  key: 'vale-gloves',
  slot: EquipmentSlotId.Hands,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 1,
  maxHp: 1,
});
