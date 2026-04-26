import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const dawnCharmItemConfig = createExpansionItemConfig({
  key: 'dawn-charm',
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  category: 'artifact',
  tier: 4,
  rarity: 'epic',
  power: 3,
  defense: 1,
  maxHp: 4,
});
