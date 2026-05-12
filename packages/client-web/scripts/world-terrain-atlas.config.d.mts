export interface WorldTerrainAtlasSource {
  id: string;
  source: string;
}

export const WORLD_TERRAIN_ATLAS_COLUMNS: number;
export const WORLD_TERRAIN_ATLAS_OUTPUTS: {
  image: string;
  manifest: string;
};
export const PAINTED_BLOCKER_TERRAIN_SOURCES: ReadonlyArray<WorldTerrainAtlasSource>;
export const BASE_WORLD_TERRAIN_ATLAS_SOURCES: ReadonlyArray<WorldTerrainAtlasSource>;
export const WORLD_TERRAIN_ATLAS_SOURCES: ReadonlyArray<WorldTerrainAtlasSource>;
