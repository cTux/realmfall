import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';
import { buildUtilityStructureTags } from './structureTagRules';

export const manaAnchorStructureConfig: StructureConfig = {
  type: 'mana-anchor',
  title: structureTitle('mana-anchor'),
  description: structureDescription('mana-anchor'),
  icon: ContentIcons.Sparkles,
  tint: 0x60a5fa,
  functionsProvided: [],
  tags: buildUtilityStructureTags(),
};
