import { normalizeTiles } from './normalizeTileState';
import {
  type DungeonWorldMetadata,
  type GameWorldState,
} from '../game/dungeons/types';
import type { GameState } from '../game/stateTypes';
import { cloneEnemies, cloneTiles } from '../game/stateClone';
import {
  isDungeonTemplateId,
  isDungeonThemeId,
  isFiniteNumber,
  isRecord,
  isWorldKind,
  normalizeHexCoord,
} from './normalizeShared';
import { normalizeEnemies } from './normalizeEnemyState';

export function normalizeWorlds(
  value: unknown,
  {
    surfaceWorldId,
    surfaceTiles,
    surfaceEnemies,
  }: {
    surfaceWorldId: string;
    surfaceTiles: GameState['tiles'];
    surfaceEnemies: GameState['enemies'];
  },
): GameState['worlds'] {
  const defaultSurfaceWorld: GameWorldState = {
    id: surfaceWorldId,
    kind: 'surface',
    tiles: cloneTiles(surfaceTiles),
    enemies: cloneEnemies(surfaceEnemies),
  };

  if (!isRecord(value)) {
    return { [surfaceWorldId]: defaultSurfaceWorld };
  }

  const worlds: GameState['worlds'] = {};
  for (const [key, world] of Object.entries(value)) {
    const normalizedWorld = normalizeWorld(world, {
      fallbackId: key,
      surfaceWorldId,
      surfaceTiles: key === surfaceWorldId ? surfaceTiles : {},
      surfaceEnemies: key === surfaceWorldId ? surfaceEnemies : {},
    });
    if (normalizedWorld) {
      worlds[normalizedWorld.id] = normalizedWorld;
    }
  }

  if (!worlds[surfaceWorldId]) {
    worlds[surfaceWorldId] = defaultSurfaceWorld;
  }

  return worlds;
}

function normalizeWorld(
  value: unknown,
  {
    fallbackId,
    surfaceWorldId,
    surfaceTiles,
    surfaceEnemies,
  }: {
    fallbackId: string;
    surfaceWorldId: string;
    surfaceTiles: GameState['tiles'];
    surfaceEnemies: GameState['enemies'];
  },
): GameWorldState | null {
  if (!isRecord(value)) {
    return fallbackId === surfaceWorldId
      ? {
          id: surfaceWorldId,
          kind: 'surface',
          tiles: cloneTiles(surfaceTiles),
          enemies: cloneEnemies(surfaceEnemies),
        }
      : null;
  }

  const id = typeof value.id === 'string' ? value.id : fallbackId;
  const kind = isWorldKind(value.kind)
    ? value.kind
    : id === surfaceWorldId
      ? 'surface'
      : null;
  if (!kind) {
    return null;
  }

  const tiles = normalizeTiles(
    value.tiles,
    id === surfaceWorldId ? surfaceTiles : {},
  );
  const enemies = normalizeEnemies(
    value.enemies,
    id === surfaceWorldId ? surfaceEnemies : {},
  );

  if (kind === 'dungeon') {
    const dungeon = normalizeDungeonMetadata(value.dungeon);
    if (!dungeon) {
      return null;
    }

    return {
      id,
      kind,
      tiles,
      enemies,
      dungeon,
    };
  }

  return {
    id,
    kind,
    tiles,
    enemies,
  };
}

export function normalizeDungeonEntrances(
  value: unknown,
): GameState['dungeonEntrances'] {
  if (!isRecord(value)) {
    return {};
  }

  const dungeonEntrances: GameState['dungeonEntrances'] = {};
  for (const [key, record] of Object.entries(value)) {
    if (!isRecord(record) || typeof record.dungeonId !== 'string') {
      continue;
    }

    const surfaceCoord = normalizeHexCoord(record.surfaceCoord);
    if (!surfaceCoord) {
      continue;
    }

    dungeonEntrances[key] = {
      dungeonId: record.dungeonId,
      surfaceCoord,
    };
  }

  return dungeonEntrances;
}

export function normalizeActiveDungeon(
  value: unknown,
): GameState['activeDungeon'] | null {
  if (!isRecord(value) || typeof value.dungeonId !== 'string') {
    return null;
  }

  const returnCoord = normalizeHexCoord(value.returnCoord);
  const surfaceCoord = normalizeHexCoord(value.surfaceCoord);
  if (!returnCoord || !surfaceCoord) {
    return null;
  }

  return {
    dungeonId: value.dungeonId,
    returnCoord,
    surfaceCoord,
  };
}

export function normalizeDungeonMetadata(
  value: unknown,
): DungeonWorldMetadata | null {
  if (!isRecord(value)) {
    return null;
  }

  const entranceCoord = normalizeHexCoord(value.entranceCoord);
  const finalChestCoord = normalizeHexCoord(value.finalChestCoord);
  const surfaceEntranceCoord = normalizeHexCoord(value.surfaceEntranceCoord);
  if (
    typeof value.cleared !== 'boolean' ||
    !entranceCoord ||
    !finalChestCoord ||
    typeof value.finalEliteEnemyId !== 'string' ||
    !isFiniteNumber(value.paddingRadius) ||
    !surfaceEntranceCoord ||
    !isDungeonTemplateId(value.templateId) ||
    !isDungeonThemeId(value.themeId)
  ) {
    return null;
  }

  return {
    cleared: value.cleared,
    entranceCoord,
    finalChestCoord,
    finalEliteEnemyId: value.finalEliteEnemyId,
    paddingRadius: value.paddingRadius,
    surfaceEntranceCoord,
    templateId: value.templateId,
    themeId: value.themeId,
  };
}
