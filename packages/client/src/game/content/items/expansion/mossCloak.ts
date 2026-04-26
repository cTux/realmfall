import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossCloakItemConfig = createExpansionItemConfig({
  key: 'moss-cloak',
  slot: EquipmentSlotId.Cloak,
  icon: ContentIcons.Hood,
  category: 'armor',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 4,
  maxHp: 4,
});
