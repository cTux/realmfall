import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossBeltItemConfig = createExpansionItemConfig({
  key: 'moss-belt',
  slot: EquipmentSlotId.Belt,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 4,
  maxHp: 4,
});
