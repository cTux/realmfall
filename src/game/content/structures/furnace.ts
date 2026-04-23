import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildCraftingStructureTags } from './structureTagRules';

export const furnaceStructureConfig: StructureConfig = {
  type: 'furnace',
  title: structureTitle('furnace'),
  description: structureDescription('furnace'),
  icon: ContentIcons.Furnace,
  tint: 0xffffff,
  functionsProvided: ['smelt'],
  tags: buildCraftingStructureTags(GAME_TAGS.structure.furnace),
  globalAppearanceThreshold: 0.968,
};
