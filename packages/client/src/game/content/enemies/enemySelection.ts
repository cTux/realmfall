import type { Terrain } from '../../types';
import { getTerrainContentTerrain } from '../../worldTerrain';
import { ENEMY_CONFIGS } from './enemyCatalog';
import { gluttonyEnemyConfig } from './gluttony';
import { raiderEnemyConfig } from './raider';

export function pickEnemyConfig(
  terrain: Terrain,
  roll: number,
  elite: boolean,
  worldBoss = false,
) {
  if (worldBoss) return gluttonyEnemyConfig;
  const candidates = ENEMY_CONFIGS.filter((config) => {
    if (config.worldBoss) return false;
    const chance = elite
      ? (config.eliteAppearanceChance ?? 0)
      : resolveTerrainAppearanceChance(
          config.appearanceChanceByTerrain,
          terrain,
        );
    return chance > 0;
  });

  if (candidates.length === 0) return raiderEnemyConfig;

  const totalChance = candidates.reduce(
    (sum, config) =>
      sum +
      (elite
        ? (config.eliteAppearanceChance ?? 0)
        : resolveTerrainAppearanceChance(
            config.appearanceChanceByTerrain,
            terrain,
          )),
    0,
  );

  let cursor = roll * totalChance;
  for (const config of candidates) {
    const chance = elite
      ? (config.eliteAppearanceChance ?? 0)
      : resolveTerrainAppearanceChance(
          config.appearanceChanceByTerrain,
          terrain,
        );
    cursor -= chance;
    if (cursor <= 0) return config;
  }

  return candidates[candidates.length - 1] ?? raiderEnemyConfig;
}

function resolveTerrainAppearanceChance(
  appearanceChanceByTerrain: Partial<Record<Terrain, number>>,
  terrain: Terrain,
) {
  const exactChance = appearanceChanceByTerrain[terrain];
  if (typeof exactChance === 'number') {
    return exactChance;
  }

  return appearanceChanceByTerrain[getTerrainContentTerrain(terrain)] ?? 0;
}
