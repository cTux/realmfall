import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossGlovesItemConfig = createExpansionItemConfig({
  key: 'moss-gloves',
  slot: EquipmentSlotId.Hands,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 4,
  maxHp: 4,
});
