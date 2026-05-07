import { cloneTile, cloneTiles } from '../game/stateClone';
import type { GameState } from '../game/stateTypes';
import {
  isFiniteNumber,
  isRecord,
  isStringArray,
  isStructure,
  isTerrain,
  normalizeHexCoord,
} from './normalizeShared';
import { normalizeItemArray } from './normalizeInventoryState';

export function normalizeTiles(
  value: unknown,
  fallback: GameState['tiles'],
): GameState['tiles'] {
  if (!isRecord(value)) {
    return cloneTiles(fallback);
  }

  const tiles = cloneTiles(fallback);

  for (const [key, tile] of Object.entries(value)) {
    const normalizedTile = normalizeTile(tile, fallback[key]);
    if (normalizedTile) {
      tiles[key] = normalizedTile;
    }
  }

  return tiles;
}

export function normalizeTile(
  value: unknown,
  fallback?: GameState['tiles'][string],
): GameState['tiles'][string] | null {
  if (!isRecord(value)) {
    return fallback ? cloneTile(fallback) : null;
  }

  const coord = normalizeHexCoord(value.coord) ?? fallback?.coord ?? null;
  const items = normalizeItemArray(value.items, fallback?.items ?? []);
  const claim = normalizeTileClaim(value.claim);

  if (!coord) {
    return null;
  }

  return {
    coord,
    terrain: isTerrain(value.terrain)
      ? value.terrain
      : (fallback?.terrain ?? 'plains'),
    ...(isStructure(value.structure)
      ? { structure: value.structure }
      : fallback?.structure === undefined
        ? {}
        : { structure: fallback.structure }),
    ...(isFiniteNumber(value.structureHp)
      ? { structureHp: value.structureHp }
      : fallback?.structureHp === undefined
        ? {}
        : { structureHp: fallback.structureHp }),
    ...(isFiniteNumber(value.structureMaxHp)
      ? { structureMaxHp: value.structureMaxHp }
      : fallback?.structureMaxHp === undefined
        ? {}
        : { structureMaxHp: fallback.structureMaxHp }),
    ...(isFiniteNumber(value.townStockDay)
      ? { townStockDay: value.townStockDay }
      : fallback?.townStockDay === undefined
        ? {}
        : { townStockDay: fallback.townStockDay }),
    ...(isStringArray(value.townStockPurchasedItemIds)
      ? { townStockPurchasedItemIds: [...value.townStockPurchasedItemIds] }
      : fallback?.townStockPurchasedItemIds === undefined
        ? {}
        : {
            townStockPurchasedItemIds: [...fallback.townStockPurchasedItemIds],
          }),
    items,
    enemyIds: isStringArray(value.enemyIds)
      ? [...value.enemyIds]
      : [...(fallback?.enemyIds ?? [])],
    ...(claim === null
      ? fallback?.claim === undefined
        ? {}
        : { claim: fallback.claim }
      : claim === undefined
        ? fallback?.claim === undefined
          ? {}
          : { claim: fallback.claim }
        : { claim }),
  };
}

function normalizeTileClaim(
  value: unknown,
): GameState['tiles'][string]['claim'] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.ownerId !== 'string' ||
    (value.ownerType !== 'player' && value.ownerType !== 'faction') ||
    typeof value.ownerName !== 'string' ||
    typeof value.borderColor !== 'string'
  ) {
    return null;
  }

  if (value.npc !== undefined) {
    if (!isRecord(value.npc) || typeof value.npc.name !== 'string') {
      return null;
    }

    if (
      value.npc.enemyId !== undefined &&
      typeof value.npc.enemyId !== 'string'
    ) {
      return null;
    }
  }

  const normalizedNpc =
    value.npc === undefined
      ? undefined
      : {
          name: value.npc.name as string,
          ...(value.npc.enemyId === undefined
            ? {}
            : { enemyId: value.npc.enemyId as string }),
        };

  return {
    ownerId: value.ownerId,
    ownerType: value.ownerType as NonNullable<
      GameState['tiles'][string]['claim']
    >['ownerType'],
    ownerName: value.ownerName,
    borderColor: value.borderColor,
    ...(normalizedNpc === undefined ? {} : { npc: normalizedNpc }),
  };
}
