import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const riftHoodItemConfig = createExpansionItemConfig({
  key: 'rift-hood',
  slot: EquipmentSlotId.Head,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
});
