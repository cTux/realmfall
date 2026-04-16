import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const shardBracersItemConfig = createExpansionItemConfig({
  key: 'shard-bracers',
  slot: EquipmentSlotId.Bracers,
  icon: ContentIcons.Gauntlet,
  category: 'armor',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 0,
});
