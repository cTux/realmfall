import type { Terrain } from '../../types';
import type { DungeonThemeId } from '../types';

export interface DungeonThemeDefinition {
  id: DungeonThemeId;
  wall: Terrain;
  floors: readonly [Terrain, Terrain, Terrain];
}

export const DUNGEON_THEME_CATALOG = {
  'brick-halls': {
    id: 'brick-halls',
    wall: 'dungeon-brick-wall',
    floors: [
      'dungeon-brick-floor',
      'dungeon-brick-cracked',
      'dungeon-brick-moss',
    ],
  },
  'mud-catacombs': {
    id: 'mud-catacombs',
    wall: 'dungeon-mud-wall',
    floors: ['dungeon-mud-floor', 'dungeon-mud-rut', 'dungeon-mud-puddle'],
  },
  'obsidian-vault': {
    id: 'obsidian-vault',
    wall: 'dungeon-obsidian-wall',
    floors: [
      'dungeon-obsidian-floor',
      'dungeon-obsidian-ash',
      'dungeon-obsidian-ember',
    ],
  },
} as const satisfies Record<DungeonThemeId, DungeonThemeDefinition>;
