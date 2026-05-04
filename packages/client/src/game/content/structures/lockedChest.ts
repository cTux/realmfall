import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildUtilityStructureTags } from './structureTagRules';

export const lockedChestStructureConfig: StructureConfig = {
  type: 'locked-chest',
  title: structureTitle('locked-chest'),
  description: structureDescription('locked-chest'),
  icon: ContentIcons.LockedChest,
  tint: 0xf59e0b,
  functionsProvided: ['locked-loot'],
  tags: buildUtilityStructureTags(GAME_TAGS.structure.chest),
  globalAppearanceThreshold: 0.994,
};
