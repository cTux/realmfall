import { hexKey, hexNeighbors } from '@realmfall/core/game/hex';
import { getTerrainProfile } from '../../game/worldTerrain';
import type { VisibleWorldTile } from './visibleWorldTiles';
import { tileStyle } from './renderSceneEnvironment';

const EDGE_VERTEX_INDEX_BY_DIRECTION = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
] as const;

export interface TerrainTransitionOverlay {
  color: number;
  edgeIndex: number;
  innerAlpha: number;
  outerAlpha: number;
}

export function getTerrainTransitionOverlays(
  tile: VisibleWorldTile,
  visibleTileMap: Map<string, VisibleWorldTile> | null,
) {
  if (visibleTileMap === null) {
    return [];
  }

  const tileBiome = getTerrainProfile(tile.terrain).biome;
  const tileColor = tileStyle(tile.terrain).color;

  return hexNeighbors(tile.coord).flatMap((neighborCoord, edgeIndex) => {
    const neighbor = visibleTileMap.get(hexKey(neighborCoord));
    if (neighbor === undefined || neighbor.unknown === true) {
      return [];
    }

    const neighborBiome = getTerrainProfile(neighbor.terrain).biome;
    if (neighborBiome === tileBiome) {
      return [];
    }

    const neighborColor = tileStyle(neighbor.terrain).color;
    const contrast = getColorContrast(tileColor, neighborColor);
    return [
      {
        color: mixColor(tileColor, neighborColor, 0.64),
        edgeIndex,
        innerAlpha: 0.07 + contrast * 0.08,
        outerAlpha: 0.12 + contrast * 0.12,
      } satisfies TerrainTransitionOverlay,
    ];
  });
}

export function getTerrainTransitionSignature(
  tile: VisibleWorldTile,
  visibleTileMap: Map<string, VisibleWorldTile> | null,
) {
  return getTerrainTransitionOverlays(tile, visibleTileMap)
    .map(
      ({ color, edgeIndex, innerAlpha, outerAlpha }) =>
        `${edgeIndex}:${color.toString(16)}:${innerAlpha.toFixed(3)}:${outerAlpha.toFixed(3)}`,
    )
    .join('|');
}

export function getTerrainTransitionBandPolygons(
  poly: number[],
  overlay: TerrainTransitionOverlay,
) {
  const vertices = chunkPolygon(poly);
  const [startIndex, endIndex] = EDGE_VERTEX_INDEX_BY_DIRECTION[
    overlay.edgeIndex
  ] ?? [0, 1];
  const start = vertices[startIndex];
  const end = vertices[endIndex];
  if (!start || !end) {
    return null;
  }

  const center = getPolygonCenter(vertices);
  const outerMid = midpoint(start, end);
  const innerStart = lerpPoint(start, center, 0.42);
  const innerEnd = lerpPoint(end, center, 0.42);
  const innerMid = lerpPoint(outerMid, center, 0.62);

  return {
    inner: toPolygonArray([innerStart, innerEnd, innerMid]),
    outer: toPolygonArray([start, end, innerEnd, innerStart]),
  };
}

function chunkPolygon(poly: number[]) {
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < poly.length; index += 2) {
    const x = poly[index];
    const y = poly[index + 1];
    if (x == null || y == null) {
      continue;
    }
    points.push({ x, y });
  }
  return points;
}

function getPolygonCenter(points: Array<{ x: number; y: number }>) {
  const total = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  const count = Math.max(points.length, 1);
  return { x: total.x / count, y: total.y / count };
}

function midpoint(
  left: { x: number; y: number },
  right: { x: number; y: number },
) {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

function lerpPoint(
  start: { x: number; y: number },
  end: { x: number; y: number },
  amount: number,
) {
  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  };
}

function toPolygonArray(points: Array<{ x: number; y: number }>) {
  return points.flatMap((point) => [point.x, point.y]);
}

function getColorContrast(left: number, right: number) {
  const red = Math.abs((left >> 16) - (right >> 16));
  const green = Math.abs(((left >> 8) & 0xff) - ((right >> 8) & 0xff));
  const blue = Math.abs((left & 0xff) - (right & 0xff));
  return Math.min(1, (red + green + blue) / (255 * 3));
}

function mixColor(left: number, right: number, amount: number) {
  const progress = Math.max(0, Math.min(1, amount));
  const red = Math.round(
    ((left >> 16) & 0xff) +
      (((right >> 16) & 0xff) - ((left >> 16) & 0xff)) * progress,
  );
  const green = Math.round(
    ((left >> 8) & 0xff) +
      (((right >> 8) & 0xff) - ((left >> 8) & 0xff)) * progress,
  );
  const blue = Math.round(
    (left & 0xff) + ((right & 0xff) - (left & 0xff)) * progress,
  );
  return (red << 16) | (green << 8) | blue;
}
