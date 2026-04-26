import {
  getGatheringStructureConfig,
  getStructureConfig,
  isGatheringStructureType,
} from './content/structures';
import { enemyIndexFromId, makeEnemy } from './combat';
import { isFactionNpcEnemyId } from './territories';
import { hexKey, hexNeighbors, hexesInRange, type HexCoord } from './hex';
import { pickTerrain } from './worldTerrain';
import { isWorldBossEnemyId, worldBossEnemyId } from './worldBoss';
import {
  buildRegularTile,
  findNearestStructureCoord,
  findSpawnedWorldBossCenter,
} from './worldTileGeneration';
import type {
  GameState,
  GatheringStructureType,
  StructureType,
  Tile,
  Terrain,
} from './types';

export {
  makeArtifact,
  makeArmor,
  makeOffhand,
  makeWeapon,
} from './worldGeneratedItems';

export function cacheSafeStart(state: GameState) {
  const center = { q: 0, r: 0 };
  state.tiles[hexKey(center)] = {
    coord: center,
    terrain: 'plains',
    items: [],
    structure: undefined,
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds: [],
    claim: undefined,
  };
  hexNeighbors(center).forEach((coord) => {
    state.tiles[hexKey(coord)] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
      claim: undefined,
    };
  });
}

export function ensureTileState(state: GameState, coord: HexCoord) {
  const key = hexKey(coord);
  if (!state.tiles[key]) {
    state.tiles[key] = buildTile(state.seed, coord);
  }

  const tile = state.tiles[key];
  tile.enemyIds.forEach((enemyId) => {
    if (!state.enemies[enemyId]) {
      const enemyName =
        tile.claim?.npc?.enemyId === enemyId ? tile.claim?.npc.name : undefined;
      state.enemies[enemyId] = makeEnemy(
        state.seed,
        coord,
        tile.terrain,
        enemyIndexFromId(enemyId),
        tile.structure,
        state.bloodMoonActive,
        {
          enemyId,
          name: enemyName,
          aggressive: !isFactionNpcEnemyId(enemyId),
          worldBoss: isWorldBossEnemyId(enemyId),
        },
      );
    }
  });
}

export function buildTile(seed: string, coord: HexCoord): Tile {
  if (coord.q === 0 && coord.r === 0) {
    return {
      coord,
      terrain: 'plains',
      structure: undefined,
      items: [],
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
    };
  }

  const terrain = pickTerrain(seed, coord);
  const worldBossCenter = findSpawnedWorldBossCenter(seed, coord);
  if (worldBossCenter) {
    const isBossCenter =
      worldBossCenter.q === coord.q && worldBossCenter.r === coord.r;
    return {
      coord,
      terrain,
      structure: undefined,
      items: [],
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: isBossCenter ? [worldBossEnemyId(coord)] : [],
    };
  }
  return buildRegularTile(seed, coord, terrain);
}

export function findNearestStructure(
  seed: string,
  from: HexCoord,
  structure: StructureType,
) {
  return findNearestStructureCoord(seed, from, structure, buildTile);
}

export function isGatheringStructure(
  structure?: StructureType,
): structure is GatheringStructureType {
  return isGatheringStructureType(structure);
}

export function structureActionLabel(structure?: StructureType) {
  if (!structure) return null;
  return isGatheringStructure(structure)
    ? getGatheringStructureConfig(structure).gathering.actionLabel
    : null;
}

export function describeStructure(structure?: StructureType) {
  if (!structure) return 'None';
  return getStructureConfig(structure).title;
}

export function describeStructureDescription(structure?: StructureType) {
  if (!structure) return null;
  return getStructureConfig(structure).description;
}

export function normalizeStructureState(tile: Tile): Tile {
  if (tile.structure === 'dungeon') {
    if (tile.enemyIds.length === 0 && tile.items.length === 0) {
      return {
        ...tile,
        structure: undefined,
        structureHp: undefined,
        structureMaxHp: undefined,
      };
    }
    return tile;
  }

  if (isGatheringStructure(tile.structure) && (tile.structureHp ?? 0) <= 0) {
    return {
      ...tile,
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
    };
  }

  return tile;
}

export function structureDefinition(structure: GatheringStructureType) {
  return getGatheringStructureConfig(structure).gathering;
}

export function resolveLootOutcomeRoll(roll: number) {
  const normalized = Math.max(0, Math.min(0.999999, roll));
  return 1 - normalized;
}

export function countTerrainChangesForSet(
  state: GameState,
  coord: HexCoord,
  terrain: Terrain,
  radius: number,
) {
  let changedCount = 0;

  for (const target of hexesInRange(coord, radius)) {
    const targetKey = hexKey(target);
    const tile = state.tiles[targetKey];
    if (!tile || tile.terrain !== terrain) {
      changedCount += 1;
    }
  }

  return changedCount;
}

export function setTerrainInRadius(
  state: GameState,
  center: HexCoord,
  terrain: Terrain,
  radius: number,
) {
  if (radius < 0) return 0;

  let changedCount = 0;

  for (const coord of hexesInRange(center, radius)) {
    const key = hexKey(coord);
    const tile = state.tiles[key];
    if (!tile) {
      state.tiles[key] = makeEmptyTile(coord, terrain);
      changedCount += 1;
      continue;
    }

    if (tile.terrain === terrain) {
      continue;
    }

    tile.terrain = terrain;
    changedCount += 1;
  }

  return changedCount;
}

function makeEmptyTile(coord: HexCoord, terrain: Terrain): Tile {
  return {
    coord,
    terrain,
    items: [],
    enemyIds: [],
  };
}
