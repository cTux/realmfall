import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildCraftingStructureTags } from './structureTagRules';

export const forgeStructureConfig: StructureConfig = {
  type: 'forge',
  title: structureTitle('forge'),
  description: structureDescription('forge'),
  icon: ContentIcons.Anvil,
  tint: 0xf97316,
  functionsProvided: ['prospect'],
  tags: buildCraftingStructureTags(GAME_TAGS.structure.forge),
  globalAppearanceThreshold: 0.984,
};
