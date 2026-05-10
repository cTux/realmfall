import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const ironboundCharmItemConfig = createExpansionItemConfig({
  key: 'ironbound-charm',
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  category: 'artifact',
  tier: 2,
  rarity: 'uncommon',
  power: 1,
  defense: 1,
  maxHp: 3,
});
