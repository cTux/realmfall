import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const hollowBladeItemConfig = createExpansionItemConfig({
  key: 'hollow-blade',
  slot: EquipmentSlotId.Weapon,
  icon: ContentIcons.Weapon,
  category: 'weapon',
  tier: 3,
  rarity: 'rare',
  power: 5,
  defense: 0,
  maxHp: 0,
});
