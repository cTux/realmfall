import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const voidGlovesItemConfig = createExpansionItemConfig({
  key: 'void-gloves',
  slot: EquipmentSlotId.Hands,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 3,
  maxHp: 3,
});
