import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildUtilityStructureTags } from './structureTagRules';

export const dungeonChestStructureConfig: StructureConfig = {
  type: 'dungeon-chest',
  title: structureTitle('dungeon-chest'),
  description: structureDescription('dungeon-chest'),
  icon: ContentIcons.LockedChest,
  tint: 0xfbbf24,
  functionsProvided: ['loot'],
  tags: buildUtilityStructureTags(GAME_TAGS.structure.chest),
};
