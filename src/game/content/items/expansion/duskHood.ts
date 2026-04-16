import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const duskHoodItemConfig = createExpansionItemConfig({
  key: 'dusk-hood',
  slot: EquipmentSlotId.Head,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 3,
  maxHp: 3,
});
