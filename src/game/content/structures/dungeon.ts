import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import { GAME_TAGS } from '../tags';
import type { StructureConfig } from '../types';
import { buildCombatStructureTags } from './structureTagRules';

export const dungeonStructureConfig: StructureConfig = {
  type: 'dungeon',
  title: structureTitle('dungeon'),
  description: structureDescription('dungeon'),
  icon: ContentIcons.DungeonGate,
  tint: 0xa855f7,
  functionsProvided: ['elite-combat', 'loot'],
  tags: buildCombatStructureTags(GAME_TAGS.structure.dungeon),
  globalAppearanceThreshold: 0.992,
};
