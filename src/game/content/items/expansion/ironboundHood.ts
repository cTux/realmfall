import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ironboundHoodItemConfig = createExpansionItemConfig({
  key: 'ironbound-hood',
  slot: EquipmentSlotId.Head,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 2,
  maxHp: 2,
});
