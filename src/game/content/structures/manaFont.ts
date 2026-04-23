import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const manaFontStructureConfig: StructureConfig = {
  type: 'mana-font',
  title: structureTitle('mana-font'),
  description: structureDescription('mana-font'),
  icon: ContentIcons.Sparkles,
  tint: 0x22d3ee,
  functionsProvided: ['enchant'],
  itemModification: {
    kind: 'enchant',
    hintKey: 'ui.hexInfo.structureHint.manaFont',
  },
  globalAppearanceThreshold: 0.972,
};
