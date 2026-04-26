import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const mossCharmItemConfig = createExpansionItemConfig({
  key: 'moss-charm',
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  category: 'artifact',
  tier: 5,
  rarity: 'legendary',
  power: 4,
  defense: 1,
  maxHp: 5,
});
