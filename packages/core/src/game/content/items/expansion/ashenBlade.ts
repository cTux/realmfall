import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ashenBladeItemConfig = createExpansionItemConfig({
  key: 'ashen-blade',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  category: 'weapon',
  tier: 1,
  rarity: 'common',
  power: 3,
  defense: 0,
  maxHp: 0,
});
