import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const valeBracersItemConfig = createExpansionItemConfig({
  key: 'vale-bracers',
  slot: EquipmentSlotId.Bracers,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 1,
  maxHp: 0,
});
