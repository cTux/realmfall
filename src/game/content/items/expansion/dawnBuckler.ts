import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const dawnBucklerItemConfig = createExpansionItemConfig({
  key: 'dawn-buckler',
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 4,
  maxHp: 3,
});
