import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossBucklerItemConfig = createExpansionItemConfig({
  key: 'moss-buckler',
  slot: EquipmentSlotId.Offhand,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 5,
  maxHp: 4,
});
