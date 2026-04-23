import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';
import { buildCraftingStructureTags } from './structureTagRules';

export const corruptionAltarStructureConfig: StructureConfig = {
  type: 'corruption-altar',
  title: structureTitle('corruption-altar'),
  description: structureDescription('corruption-altar'),
  icon: ContentIcons.Totem,
  tint: 0xef4444,
  functionsProvided: ['corrupt'],
  tags: buildCraftingStructureTags(),
  itemModification: {
    kind: 'corrupt',
    hintKey: 'ui.hexInfo.structureHint.corruptionAltar',
  },
  globalAppearanceThreshold: 0.988,
};
