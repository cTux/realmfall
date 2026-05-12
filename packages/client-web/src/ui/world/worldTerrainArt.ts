import worldTerrainAtlasManifest from '../../assets/generated/world-terrain-atlas.json';
import worldTerrainAtlasImage from '../../assets/generated/world-terrain-atlas.png';
import { TERRAINS, type Terrain } from '@realmfall/core/game/stateTypes';
import {
  resolveConnectedWorldTerrainId,
  type ConnectedWorldTerrainId,
} from './worldTerrainConnectivity';
import type { VisibleWorldTile } from './visibleWorldTiles';

export type WorldTerrainAtlasTerrainId =
  keyof typeof worldTerrainAtlasManifest.frames;
export type WorldTerrainAtlasFrameId =
  `world-terrain-atlas:${WorldTerrainAtlasTerrainId}`;

const WORLD_TERRAIN_ATLAS_FRAME_PREFIX = 'world-terrain-atlas:';
const WORLD_TERRAIN_ATLAS_FRAMES = worldTerrainAtlasManifest.frames as Record<
  WorldTerrainAtlasTerrainId,
  { x: number; y: number; w: number; h: number; source: string }
>;
const WORLD_TERRAIN_ATLAS_TERRAINS = Object.keys(
  WORLD_TERRAIN_ATLAS_FRAMES,
) as WorldTerrainAtlasTerrainId[];

export const WORLD_TERRAIN_ART = Object.fromEntries(
  TERRAINS.map((terrain) => [terrain, getWorldTerrainFrameId(terrain)]),
) as Record<Terrain, WorldTerrainAtlasFrameId>;

export function terrainArtFor(terrain: Terrain) {
  return WORLD_TERRAIN_ART[terrain];
}

export function terrainArtForVisibleTile(
  tile: VisibleWorldTile,
  visibleTileMap: Map<string, VisibleWorldTile> | null,
) {
  return getWorldTerrainFrameId(
    resolveConnectedWorldTerrainId(
      tile,
      visibleTileMap,
    ) as ConnectedWorldTerrainId & WorldTerrainAtlasTerrainId,
  );
}

export function getWorldTerrainAssetIds() {
  return WORLD_TERRAIN_ATLAS_TERRAINS.map((terrain) =>
    getWorldTerrainFrameId(terrain),
  );
}

export function getWorldTerrainAtlasImage() {
  return worldTerrainAtlasImage;
}

export function getWorldTerrainFrameId(
  terrain: WorldTerrainAtlasTerrainId,
): WorldTerrainAtlasFrameId {
  return `${WORLD_TERRAIN_ATLAS_FRAME_PREFIX}${terrain}`;
}

export function isWorldTerrainFrameId(
  assetId: string,
): assetId is WorldTerrainAtlasFrameId {
  return assetId.startsWith(WORLD_TERRAIN_ATLAS_FRAME_PREFIX);
}

export function getWorldTerrainFrame(assetId: WorldTerrainAtlasFrameId): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const terrain = assetId.slice(
    WORLD_TERRAIN_ATLAS_FRAME_PREFIX.length,
  ) as WorldTerrainAtlasTerrainId;
  const frame = WORLD_TERRAIN_ATLAS_FRAMES[terrain];

  if (!frame) {
    throw new Error(`Unknown world terrain atlas frame: ${assetId}`);
  }

  return {
    x: frame.x,
    y: frame.y,
    w: frame.w,
    h: frame.h,
  };
}
