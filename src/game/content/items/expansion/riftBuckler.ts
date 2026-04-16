import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const riftBucklerItemConfig = createExpansionItemConfig({
  key: 'rift-buckler',
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 2,
  maxHp: 1,
});
