import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossBladeItemConfig = createExpansionItemConfig({
  key: 'moss-blade',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  category: 'weapon',
  tier: 5,
  rarity: 'legendary',
  power: 7,
  defense: 0,
  maxHp: 0,
});
