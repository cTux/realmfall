import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const voidVestItemConfig = createExpansionItemConfig({
  key: 'void-vest',
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 4,
  maxHp: 3,
});
