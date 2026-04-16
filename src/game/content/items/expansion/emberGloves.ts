import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const emberGlovesItemConfig = createExpansionItemConfig({
  key: 'ember-gloves',
  slot: EquipmentSlotId.Hands,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 2,
  maxHp: 2,
});
