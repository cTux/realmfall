import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const dawnCloakItemConfig = createExpansionItemConfig({
  key: 'dawn-cloak',
  slot: EquipmentSlotId.Cloak,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 3,
  maxHp: 3,
});
