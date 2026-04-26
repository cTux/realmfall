import worldTerrainAtlasManifest from '../../assets/generated/world-terrain-atlas.json';
import worldTerrainAtlasImage from '../../assets/generated/world-terrain-atlas.png';
import type { Terrain } from '../../game/stateTypes';

export type WorldTerrainAtlasFrameId = `world-terrain-atlas:${Terrain}`;

const WORLD_TERRAIN_ATLAS_FRAME_PREFIX = 'world-terrain-atlas:';
const WORLD_TERRAIN_ATLAS_FRAMES = worldTerrainAtlasManifest.frames as Record<
  Terrain,
  { x: number; y: number; w: number; h: number; source: string }
>;

export const WORLD_TERRAIN_ART = Object.fromEntries(
  Object.keys(WORLD_TERRAIN_ATLAS_FRAMES).map((terrain) => [
    terrain,
    getWorldTerrainFrameId(terrain as Terrain),
  ]),
) as Record<Terrain, WorldTerrainAtlasFrameId>;

export function terrainArtFor(terrain: Terrain) {
  return WORLD_TERRAIN_ART[terrain];
}

export function getWorldTerrainAssetIds() {
  return Object.values(WORLD_TERRAIN_ART);
}

export function getWorldTerrainAtlasImage() {
  return worldTerrainAtlasImage;
}

export function getWorldTerrainFrameId(
  terrain: Terrain,
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
  ) as Terrain;
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
