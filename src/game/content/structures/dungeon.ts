import { structureDescription, structureTitle } from '../i18n';
import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const dungeonStructureConfig: StructureConfig = {
  type: 'dungeon',
  title: structureTitle('dungeon'),
  description: structureDescription('dungeon'),
  icon: ContentIcons.DungeonGate,
  tint: 0xa855f7,
  functionsProvided: ['elite-combat', 'loot'],
  globalAppearanceThreshold: 0.992,
};
