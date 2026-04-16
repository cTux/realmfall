import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const valeMantleItemConfig = createExpansionItemConfig({
  key: 'vale-mantle',
  slot: EquipmentSlotId.Shoulders,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 1,
  maxHp: 1,
});
