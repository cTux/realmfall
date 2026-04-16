import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossBracersItemConfig = createExpansionItemConfig({
  key: 'moss-bracers',
  slot: EquipmentSlotId.Bracers,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 4,
  maxHp: 3,
});
