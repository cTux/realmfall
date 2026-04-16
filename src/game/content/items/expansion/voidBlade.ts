import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const voidBladeItemConfig = createExpansionItemConfig({
  key: 'void-blade',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  category: 'weapon',
  tier: 4,
  rarity: 'epic',
  power: 6,
  defense: 0,
  maxHp: 0,
});
