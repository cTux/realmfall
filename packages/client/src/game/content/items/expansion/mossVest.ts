import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossVestItemConfig = createExpansionItemConfig({
  key: 'moss-vest',
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 5,
  maxHp: 4,
});
