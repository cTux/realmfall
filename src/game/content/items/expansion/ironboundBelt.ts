import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ironboundBeltItemConfig = createExpansionItemConfig({
  key: 'ironbound-belt',
  slot: EquipmentSlotId.Belt,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 2,
  maxHp: 2,
});
