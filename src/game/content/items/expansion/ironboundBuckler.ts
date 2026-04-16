import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ironboundBucklerItemConfig = createExpansionItemConfig({
  key: 'ironbound-buckler',
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 3,
  maxHp: 2,
});
