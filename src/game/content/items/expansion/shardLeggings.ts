import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const shardLeggingsItemConfig = createExpansionItemConfig({
  key: 'shard-leggings',
  slot: EquipmentSlotId.Legs,
  icon: ContentIcons.Chest,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
});
