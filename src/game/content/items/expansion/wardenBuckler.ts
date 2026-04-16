import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const wardenBucklerItemConfig = createExpansionItemConfig({
  key: 'warden-buckler',
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 4,
  maxHp: 3,
});
