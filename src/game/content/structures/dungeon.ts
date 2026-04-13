import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const dungeonStructureConfig: StructureConfig = {
  type: 'dungeon',
  title: 'Dungeon',
  description: 'A hostile den packed with stronger enemies and danger.',
  icon: ContentIcons.DungeonGate,
  tint: 0xa855f7,
  functionsProvided: ['elite-combat', 'loot'],
  globalAppearanceThreshold: 0.992,
};
