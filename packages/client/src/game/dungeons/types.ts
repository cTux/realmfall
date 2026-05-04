import type { HexCoord } from '../hex';
import type { Enemy, Tile } from '../types';

export const SURFACE_WORLD_ID = 'surface' as const;

export const WORLD_KINDS = ['surface', 'dungeon'] as const;
export type WorldKind = (typeof WORLD_KINDS)[number];

export const DUNGEON_TEMPLATE_IDS = [
  'rooms-and-corridors',
  'branching-spine',
  'dense-maze',
] as const;
export type DungeonTemplateId = (typeof DUNGEON_TEMPLATE_IDS)[number];

export const DUNGEON_THEME_IDS = [
  'brick-halls',
  'mud-catacombs',
  'obsidian-vault',
] as const;
export type DungeonThemeId = (typeof DUNGEON_THEME_IDS)[number];

interface BaseGameWorldState {
  id: string;
  kind: WorldKind;
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
}

export interface SurfaceWorldState extends BaseGameWorldState {
  kind: 'surface';
}

export interface DungeonWorldMetadata {
  cleared: boolean;
  entranceCoord: HexCoord;
  finalChestCoord: HexCoord;
  finalEliteEnemyId: string;
  paddingRadius: number;
  surfaceEntranceCoord: HexCoord;
  templateId: DungeonTemplateId;
  themeId: DungeonThemeId;
}

export interface DungeonWorldState extends BaseGameWorldState {
  kind: 'dungeon';
  dungeon: DungeonWorldMetadata;
}

export type GameWorldState = SurfaceWorldState | DungeonWorldState;

export interface DungeonEntranceRecord {
  dungeonId: string;
  surfaceCoord: HexCoord;
}

export interface ActiveDungeonRun {
  dungeonId: string;
  returnCoord: HexCoord;
  surfaceCoord: HexCoord;
}
