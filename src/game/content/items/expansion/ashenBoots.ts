import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ashenBootsItemConfig = createExpansionItemConfig({
  key: 'ashen-boots',
  slot: EquipmentSlotId.Feet,
  icon: ContentIcons.Boots,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
});
