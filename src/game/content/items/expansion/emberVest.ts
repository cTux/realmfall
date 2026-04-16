import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const emberVestItemConfig = createExpansionItemConfig({
  key: 'ember-vest',
  slot: EquipmentSlotId.Chest,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 3,
  maxHp: 2,
});
