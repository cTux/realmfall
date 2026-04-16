import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const shardCharmItemConfig = createExpansionItemConfig({
  key: 'shard-charm',
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  category: 'artifact',
  tier: 1,
  rarity: 'common',
  power: 0,
  defense: 1,
  maxHp: 2,
});
