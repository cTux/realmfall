import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ashenVestItemConfig = createExpansionItemConfig({
  key: 'ashen-vest',
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 2,
  maxHp: 1,
});
