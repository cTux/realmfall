import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const dawnBracersItemConfig = createExpansionItemConfig({
  key: 'dawn-bracers',
  slot: EquipmentSlotId.Bracers,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 3,
  maxHp: 2,
});
