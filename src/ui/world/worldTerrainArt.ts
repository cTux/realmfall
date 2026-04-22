import desertTerrain from '../../assets/images/terrain/desert-v2.png';
import forestTerrain from '../../assets/images/terrain/forest-v2.png';
import mountainTerrain from '../../assets/images/terrain/mountain-v2.png';
import plainsTerrain from '../../assets/images/terrain/plains-v2.png';
import riftTerrain from '../../assets/images/terrain/rift-v2.png';
import swampTerrain from '../../assets/images/terrain/swamp-v2.png';
import type { Terrain } from '../../game/stateTypes';

export const WORLD_TERRAIN_ART = {
  desert: desertTerrain,
  forest: forestTerrain,
  mountain: mountainTerrain,
  plains: plainsTerrain,
  rift: riftTerrain,
  swamp: swampTerrain,
} as const satisfies Record<Terrain, string>;

export function terrainArtFor(terrain: Terrain) {
  return WORLD_TERRAIN_ART[terrain];
}

export function getWorldTerrainAssetIds() {
  return Object.values(WORLD_TERRAIN_ART);
}
