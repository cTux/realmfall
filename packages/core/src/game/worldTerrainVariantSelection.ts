import type { Terrain } from './types';
import type { TerrainFamilyId } from './worldTerrainFamilies';

export interface TerrainVariantClimate {
  elevation: number;
  moisture: number;
  temperature: number;
  corruption: number;
  ruggedness: number;
  dryness: number;
  distance: number;
}

export function pickProvinceTerrainVariant(
  family: TerrainFamilyId,
  climate: TerrainVariantClimate,
  detail: number,
): Terrain {
  switch (family) {
    case 'grassland':
      if (climate.moisture > 0.64 || detail > 0.72) {
        return 'meadow';
      }
      return climate.dryness > 0.58 || detail < 0.24 ? 'steppe' : 'plains';
    case 'woodland':
      return climate.ruggedness > 0.54 || detail < 0.4 ? 'grove' : 'forest';
    case 'wetland':
      return climate.moisture > 0.82 || detail > 0.55 ? 'swamp' : 'marsh';
    case 'arid':
      if (climate.dryness > 0.84 && climate.ruggedness < 0.52) {
        return 'dunes';
      }
      return climate.ruggedness > 0.58 || detail < 0.34 ? 'badlands' : 'desert';
    case 'alpine':
      return 'highlands';
    case 'corrupted':
      return 'blasted';
    case 'dungeon':
      return climate.corruption > 0.78
        ? 'dungeon-obsidian-ash'
        : 'dungeon-brick-floor';
  }
}
