import { ContentIcons } from '../icons';
import type { StructureConfig } from '../types';

export const dungeonStructureConfig: StructureConfig = {
  type: 'dungeon',
  title: 'Rift Ruin',
  description:
    'A broken ruin where stronger foes and old spoils gather beneath the fracture.',
  icon: ContentIcons.DungeonGate,
  tint: 0xa855f7,
  functionsProvided: ['elite-combat', 'loot'],
  globalAppearanceThreshold: 0.992,
};
