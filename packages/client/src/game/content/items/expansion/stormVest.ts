import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const stormVestItemConfig = createExpansionItemConfig({
  key: 'storm-vest',
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 3,
  maxHp: 2,
});
