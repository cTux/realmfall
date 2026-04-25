import type { StructureType, Terrain } from '../../types';
import { GAME_CONFIG } from '../../config';
import { getTerrainContentTerrain } from '../../worldTerrain';
import { STRUCTURE_CONFIGS } from './structureCatalog';

const STRUCTURE_APPEARANCE = GAME_CONFIG.worldGeneration.structure;

export function pickStructureType(
  roll: number,
  resourceRoll: number,
  terrain: Terrain,
) {
  const globalStructure = STRUCTURE_CONFIGS.find((config) => {
    const threshold = resolveGlobalAppearanceThreshold(
      config.type,
      config.globalAppearanceThreshold,
    );
    return roll > threshold;
  });
  if (globalStructure) return globalStructure.type;

  const resourceStructure = STRUCTURE_CONFIGS.find((config) => {
    const threshold = resolveTerrainAppearanceThreshold(
      config.type,
      config.appearanceChanceByTerrain,
      terrain,
    );
    return resourceRoll > threshold;
  });

  return resourceStructure?.type;
}

function resolveGlobalAppearanceThreshold(
  type: StructureType,
  fallback: number | undefined,
) {
  const configuredThreshold = STRUCTURE_APPEARANCE.globalAppearanceThreshold[type];
  return typeof configuredThreshold === 'number'
    ? configuredThreshold
    : fallback ?? 1;
}

function resolveTerrainAppearanceThreshold(
  type: StructureType,
  fallback: Partial<Record<Terrain, number>> | undefined,
  terrain: Terrain,
) {
  const configured =
    STRUCTURE_APPEARANCE.appearanceChanceByTerrain[type] ??
    fallback ??
    undefined;
  const merged = {
    ...(fallback ?? {}),
    ...(configured ?? {}),
  };
  const exactThreshold = merged[terrain];
  if (typeof exactThreshold === 'number') return exactThreshold;

  const fallbackThreshold = merged[getTerrainContentTerrain(terrain)];
  return typeof fallbackThreshold === 'number' ? fallbackThreshold : 1;
}
