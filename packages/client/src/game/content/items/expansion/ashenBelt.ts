import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ashenBeltItemConfig = createExpansionItemConfig({
  key: 'ashen-belt',
  slot: EquipmentSlotId.Belt,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
});
