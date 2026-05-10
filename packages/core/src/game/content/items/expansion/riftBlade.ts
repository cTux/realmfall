import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const riftBladeItemConfig = createExpansionItemConfig({
  key: 'rift-blade',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  category: 'weapon',
  tier: 1,
  rarity: 'common',
  power: 3,
  defense: 0,
  maxHp: 0,
});
