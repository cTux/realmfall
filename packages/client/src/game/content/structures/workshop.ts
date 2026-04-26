import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildCraftingStructureTags } from './structureTagRules';

export const workshopStructureConfig: StructureConfig = {
  type: 'workshop',
  title: structureTitle('workshop'),
  description: structureDescription('workshop'),
  icon: ContentIcons.StoneCrafting,
  tint: 0x22c55e,
  functionsProvided: ['craft'],
  tags: buildCraftingStructureTags(GAME_TAGS.structure.workshop),
  globalAppearanceThreshold: 0.964,
};
