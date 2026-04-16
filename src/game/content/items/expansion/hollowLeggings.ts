import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const hollowLeggingsItemConfig = createExpansionItemConfig({
  key: 'hollow-leggings',
  slot: EquipmentSlotId.Legs,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 2,
  maxHp: 2,
});
