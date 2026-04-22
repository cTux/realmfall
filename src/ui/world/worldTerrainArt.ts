import type { HexCoord, Terrain } from '../../game/stateTypes';

const TERRAIN_ART_CANVAS_WIDTH = 1280;
const TERRAIN_ART_CANVAS_HEIGHT = 1760;
const TERRAIN_VARIANT_KEYS = ['a', 'b', 'c', 'd'] as const;

const TERRAIN_ART_MODULES = import.meta.glob(
  '../../assets/images/terrain/*-v3-*.svg',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>;

export const WORLD_TERRAIN_ART_LAYOUT = {
  x: 0.5,
  y: 0.5,
  aspectRatio: TERRAIN_ART_CANVAS_HEIGHT / TERRAIN_ART_CANVAS_WIDTH,
} as const;

export const WORLD_TERRAIN_ART = {
  badlands: terrainArtVariants('badlands'),
  desert: terrainArtVariants('desert'),
  forest: terrainArtVariants('forest'),
  highlands: terrainArtVariants('highlands'),
  mountain: terrainArtVariants('mountain'),
  plains: terrainArtVariants('plains'),
  rift: terrainArtVariants('rift'),
  swamp: terrainArtVariants('swamp'),
  tundra: terrainArtVariants('tundra'),
} as const satisfies Record<Terrain, readonly string[]>;

export function terrainArtFor(terrain: Terrain, coord?: HexCoord) {
  const variants = WORLD_TERRAIN_ART[terrain];

  if (!coord) {
    return variants[0];
  }

  return variants[terrainArtVariantIndex(terrain, coord) % variants.length];
}

export function getWorldTerrainAssetIds() {
  return Object.values(WORLD_TERRAIN_ART).flatMap((variants) => variants);
}

function terrainArtVariants(terrain: Terrain) {
  return TERRAIN_VARIANT_KEYS.map((variantKey) => {
    const asset =
      TERRAIN_ART_MODULES[
        `../../assets/images/terrain/${terrain}-v3-${variantKey}.svg`
      ];

    if (!asset) {
      throw new Error(
        `Missing world terrain asset: ${terrain}-v3-${variantKey}.svg`,
      );
    }

    return asset;
  });
}

function terrainArtVariantIndex(terrain: Terrain, coord: HexCoord) {
  let hash = 2166136261;

  for (let index = 0; index < terrain.length; index += 1) {
    hash = mixHash(hash, terrain.charCodeAt(index));
  }

  hash = mixHash(hash, coord.q + 4096);
  hash = mixHash(hash, coord.r + 4096);
  return hash >>> 0;
}

function mixHash(hash: number, value: number) {
  return Math.imul(hash ^ value, 16777619);
}
