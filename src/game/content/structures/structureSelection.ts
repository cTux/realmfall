import type { Terrain } from '../../types';
import { getTerrainContentTerrain } from '../../worldTerrain';
import { STRUCTURE_CONFIGS } from './structureCatalog';

export function pickStructureType(
  roll: number,
  resourceRoll: number,
  terrain: Terrain,
) {
  const globalStructure = STRUCTURE_CONFIGS.find(
    (config) =>
      typeof config.globalAppearanceThreshold === 'number' &&
      roll > config.globalAppearanceThreshold,
  );
  if (globalStructure) return globalStructure.type;

  const resourceStructure = STRUCTURE_CONFIGS.find(
    (config) =>
      resourceRoll >
      resolveTerrainAppearanceThreshold(
        config.appearanceChanceByTerrain,
        terrain,
      ),
  );

  return resourceStructure?.type;
}

function resolveTerrainAppearanceThreshold(
  appearanceChanceByTerrain: Partial<Record<Terrain, number>> | undefined,
  terrain: Terrain,
) {
  if (!appearanceChanceByTerrain) {
    return 1;
  }

  const exactThreshold = appearanceChanceByTerrain[terrain];
  if (typeof exactThreshold === 'number') {
    return exactThreshold;
  }

  const fallbackThreshold =
    appearanceChanceByTerrain[getTerrainContentTerrain(terrain)];
  return typeof fallbackThreshold === 'number' ? fallbackThreshold : 1;
}
