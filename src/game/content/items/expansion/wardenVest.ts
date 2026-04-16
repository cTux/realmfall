import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const wardenVestItemConfig = createExpansionItemConfig({
  key: 'warden-vest',
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 4,
  maxHp: 3,
});
