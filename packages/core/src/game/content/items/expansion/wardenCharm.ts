import { ContentIcons } from '../../icons';
import { EquipmentSlotId } from '../../ids';
import { createExpansionItemConfig } from './createExpansionItemConfig';

export const wardenCharmItemConfig = createExpansionItemConfig({
  key: 'warden-charm',
  slot: EquipmentSlotId.Amulet,
  icon: ContentIcons.Artifact,
  category: 'artifact',
  tier: 3,
  rarity: 'rare',
  power: 2,
  defense: 1,
  maxHp: 4,
});
