import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const hollowBeltItemConfig = createExpansionItemConfig({
  key: 'hollow-belt',
  slot: EquipmentSlotId.Belt,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 2,
  maxHp: 2,
});
