import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const valeBladeItemConfig = createExpansionItemConfig({
  key: 'vale-blade',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  category: 'weapon',
  tier: 2,
  rarity: 'uncommon',
  power: 4,
  defense: 0,
  maxHp: 0,
});
