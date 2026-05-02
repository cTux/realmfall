import { hexKey, type HexCoord } from '../../game/hex';
import type { Tile } from '../../game/stateTypes';

export const WORLD_HEX_REVEAL_DURATION_MS = 220;

export interface UnknownVisibleWorldTile extends Tile {
  requestedAt: number;
  unknown: true;
}

export interface ResolvedVisibleWorldTile extends Tile {
  requestedAt?: number;
  resolvedAt?: number;
  unknown?: false;
}

export type VisibleWorldTile =
  | UnknownVisibleWorldTile
  | ResolvedVisibleWorldTile;

const UNKNOWN_VISIBLE_TILE_TERRAIN = 'mountain' satisfies Tile['terrain'];

export function createUnknownVisibleWorldTile(
  coord: HexCoord,
  requestedAt = 0,
): UnknownVisibleWorldTile {
  return {
    coord,
    requestedAt,
    unknown: true,
    terrain: UNKNOWN_VISIBLE_TILE_TERRAIN,
    items: [],
    enemyIds: [],
  };
}

export function isUnknownVisibleWorldTile(
  tile: VisibleWorldTile,
): tile is UnknownVisibleWorldTile {
  return tile.unknown === true;
}

export function getVisibleWorldTileRevealProgress(
  tile: VisibleWorldTile,
  animationMs: number,
) {
  if (isUnknownVisibleWorldTile(tile)) {
    return 0;
  }

  if (tile.resolvedAt == null) {
    return 1;
  }

  return Math.max(
    0,
    Math.min(1, (animationMs - tile.resolvedAt) / WORLD_HEX_REVEAL_DURATION_MS),
  );
}

export function isVisibleWorldTileRevealActive(
  tile: VisibleWorldTile,
  animationMs: number,
) {
  return (
    !isUnknownVisibleWorldTile(tile) &&
    tile.resolvedAt != null &&
    animationMs < tile.resolvedAt + WORLD_HEX_REVEAL_DURATION_MS
  );
}

export function getVisibleWorldTileRenderKey(tile: VisibleWorldTile) {
  if (isUnknownVisibleWorldTile(tile)) {
    return `${hexKey(tile.coord)}|unknown|${tile.requestedAt}`;
  }

  return [
    hexKey(tile.coord),
    tile.terrain,
    tile.structure ?? 'none',
    tile.items.length,
    tile.enemyIds.join(','),
    tile.claim
      ? `${tile.claim.ownerType}:${tile.claim.ownerId}:${tile.claim.npc?.enemyId ?? 'none'}`
      : 'claim:none',
    tile.requestedAt ?? 0,
    tile.resolvedAt ?? 0,
  ].join('|');
}
