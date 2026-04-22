import badlandsTerrain from '../../assets/images/terrain/badlands-v2.png';
import blastedTerrain from '../../assets/images/terrain/blasted-v2.png';
import desertTerrain from '../../assets/images/terrain/desert-v2.png';
import dunesTerrain from '../../assets/images/terrain/dunes-v2.png';
import forestTerrain from '../../assets/images/terrain/forest-v2.png';
import groveTerrain from '../../assets/images/terrain/grove-v2.png';
import highlandsTerrain from '../../assets/images/terrain/highlands-v2.png';
import marshTerrain from '../../assets/images/terrain/marsh-v2.png';
import meadowTerrain from '../../assets/images/terrain/meadow-v2.png';
import mountainTerrain from '../../assets/images/terrain/mountain-v2.png';
import plainsTerrain from '../../assets/images/terrain/plains-v2.png';
import riftTerrain from '../../assets/images/terrain/rift-v2.png';
import steppeTerrain from '../../assets/images/terrain/steppe-v2.png';
import swampTerrain from '../../assets/images/terrain/swamp-v2.png';
import type { Terrain } from '../../game/stateTypes';

export const WORLD_TERRAIN_ART = {
  badlands: badlandsTerrain,
  blasted: blastedTerrain,
  desert: desertTerrain,
  dunes: dunesTerrain,
  forest: forestTerrain,
  grove: groveTerrain,
  highlands: highlandsTerrain,
  marsh: marshTerrain,
  meadow: meadowTerrain,
  mountain: mountainTerrain,
  plains: plainsTerrain,
  rift: riftTerrain,
  steppe: steppeTerrain,
  swamp: swampTerrain,
} as const satisfies Record<Terrain, string>;

export function terrainArtFor(terrain: Terrain) {
  return WORLD_TERRAIN_ART[terrain];
}

export function getWorldTerrainAssetIds() {
  return Object.values(WORLD_TERRAIN_ART);
}
