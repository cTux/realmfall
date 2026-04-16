import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const shardMantleItemConfig = createExpansionItemConfig({
  key: 'shard-mantle',
  slot: EquipmentSlotId.Shoulders,
  icon: ContentIcons.Armor,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 1,
});
