import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const wardenMantleItemConfig = createExpansionItemConfig({
  key: 'warden-mantle',
  slot: EquipmentSlotId.Shoulders,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 3,
  maxHp: 3,
});
