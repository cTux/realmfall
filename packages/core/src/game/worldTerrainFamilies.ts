import type { Terrain } from './types';

export type TerrainFamilyId =
  | 'grassland'
  | 'woodland'
  | 'wetland'
  | 'arid'
  | 'alpine'
  | 'corrupted'
  | 'dungeon';

export type TerrainVisualVariantId =
  | 'plains-bloom'
  | 'forest-moss'
  | 'mountain-ridge'
  | 'rift-fork';

export type WorldTerrainId = Terrain | TerrainVisualVariantId;

export interface TerrainFamilyDefinition {
  family: TerrainFamilyId;
  passable: boolean;
  tierBonus: number;
  gameplayTerrain: Terrain;
  worldBossEligible: boolean;
}

export const TERRAIN_FAMILY_BY_TERRAIN = {
  plains: {
    family: 'grassland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'plains',
    worldBossEligible: false,
  },
  meadow: {
    family: 'grassland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'plains',
    worldBossEligible: false,
  },
  steppe: {
    family: 'grassland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'plains',
    worldBossEligible: false,
  },
  'plains-bloom': {
    family: 'grassland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'plains',
    worldBossEligible: false,
  },
  grove: {
    family: 'woodland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'forest',
    worldBossEligible: true,
  },
  forest: {
    family: 'woodland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'forest',
    worldBossEligible: true,
  },
  'forest-moss': {
    family: 'woodland',
    passable: true,
    tierBonus: 0,
    gameplayTerrain: 'forest',
    worldBossEligible: true,
  },
  marsh: {
    family: 'wetland',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'swamp',
    worldBossEligible: false,
  },
  swamp: {
    family: 'wetland',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'swamp',
    worldBossEligible: false,
  },
  dunes: {
    family: 'arid',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'desert',
    worldBossEligible: false,
  },
  desert: {
    family: 'arid',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'desert',
    worldBossEligible: false,
  },
  badlands: {
    family: 'arid',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'desert',
    worldBossEligible: false,
  },
  highlands: {
    family: 'alpine',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'plains',
    worldBossEligible: false,
  },
  mountain: {
    family: 'alpine',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'mountain',
    worldBossEligible: false,
  },
  'mountain-ridge': {
    family: 'alpine',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'mountain',
    worldBossEligible: false,
  },
  blasted: {
    family: 'corrupted',
    passable: true,
    tierBonus: 2,
    gameplayTerrain: 'desert',
    worldBossEligible: false,
  },
  rift: {
    family: 'corrupted',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'rift',
    worldBossEligible: false,
  },
  'rift-fork': {
    family: 'corrupted',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'rift',
    worldBossEligible: false,
  },
  'dungeon-brick-floor': {
    family: 'dungeon',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'highlands',
    worldBossEligible: false,
  },
  'dungeon-brick-cracked': {
    family: 'dungeon',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'highlands',
    worldBossEligible: false,
  },
  'dungeon-brick-moss': {
    family: 'dungeon',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'grove',
    worldBossEligible: false,
  },
  'dungeon-brick-wall': {
    family: 'dungeon',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'mountain',
    worldBossEligible: false,
  },
  'dungeon-mud-floor': {
    family: 'dungeon',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'marsh',
    worldBossEligible: false,
  },
  'dungeon-mud-rut': {
    family: 'dungeon',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'marsh',
    worldBossEligible: false,
  },
  'dungeon-mud-puddle': {
    family: 'dungeon',
    passable: true,
    tierBonus: 1,
    gameplayTerrain: 'swamp',
    worldBossEligible: false,
  },
  'dungeon-mud-wall': {
    family: 'dungeon',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'swamp',
    worldBossEligible: false,
  },
  'dungeon-obsidian-floor': {
    family: 'dungeon',
    passable: true,
    tierBonus: 2,
    gameplayTerrain: 'blasted',
    worldBossEligible: false,
  },
  'dungeon-obsidian-ash': {
    family: 'dungeon',
    passable: true,
    tierBonus: 2,
    gameplayTerrain: 'blasted',
    worldBossEligible: false,
  },
  'dungeon-obsidian-ember': {
    family: 'dungeon',
    passable: true,
    tierBonus: 2,
    gameplayTerrain: 'rift',
    worldBossEligible: false,
  },
  'dungeon-obsidian-wall': {
    family: 'dungeon',
    passable: false,
    tierBonus: 2,
    gameplayTerrain: 'rift',
    worldBossEligible: false,
  },
} as const satisfies Record<WorldTerrainId, TerrainFamilyDefinition>;

export function getTerrainGameplayFamily(terrain: WorldTerrainId): Terrain {
  return TERRAIN_FAMILY_BY_TERRAIN[terrain].gameplayTerrain;
}
