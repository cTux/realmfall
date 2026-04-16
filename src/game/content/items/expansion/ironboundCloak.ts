import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ironboundCloakItemConfig = createExpansionItemConfig({
  key: 'ironbound-cloak',
  slot: EquipmentSlotId.Cloak,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 2,
  maxHp: 2,
});
