import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const riftCloakItemConfig = createExpansionItemConfig({
  key: 'rift-cloak',
  slot: EquipmentSlotId.Cloak,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
});
