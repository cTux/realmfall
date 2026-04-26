import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildCraftingStructureTags } from './structureTagRules';

export const campStructureConfig: StructureConfig = {
  type: 'camp',
  title: structureTitle('camp'),
  description: structureDescription('camp'),
  icon: ContentIcons.CampCookingPot,
  tint: 0xef4444,
  functionsProvided: ['cook'],
  tags: buildCraftingStructureTags(GAME_TAGS.structure.camp),
  globalAppearanceThreshold: 0.96,
};
