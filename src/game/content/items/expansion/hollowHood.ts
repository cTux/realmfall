import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const hollowHoodItemConfig = createExpansionItemConfig({
  key: 'hollow-hood',
  slot: EquipmentSlotId.Head,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 2,
  maxHp: 2,
});
