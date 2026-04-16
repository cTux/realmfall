import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const wardenLeggingsItemConfig = createExpansionItemConfig({
  key: 'warden-leggings',
  slot: EquipmentSlotId.Legs,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 3,
  maxHp: 3,
});
