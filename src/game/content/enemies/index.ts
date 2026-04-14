import type { Terrain } from '../../types';
import { boarEnemyConfig } from './boar';
import { gluttonyEnemyConfig } from './gluttony';
import { marauderEnemyConfig } from './marauder';
import { raiderEnemyConfig } from './raider';
import { spiderEnemyConfig } from './spider';
import { stagEnemyConfig } from './stag';
import { wolfEnemyConfig } from './wolf';

export const ENEMY_CONFIGS = [
  gluttonyEnemyConfig,
  raiderEnemyConfig,
  marauderEnemyConfig,
  wolfEnemyConfig,
  boarEnemyConfig,
  stagEnemyConfig,
  spiderEnemyConfig,
] as const;

const ENEMY_CONFIG_BY_NAME = Object.fromEntries(
  ENEMY_CONFIGS.map((config) => [config.name, config]),
);

export function getEnemyConfig(name: string) {
  return ENEMY_CONFIG_BY_NAME[name];
}

export function isAnimalEnemyType(name: string) {
  return Boolean(getEnemyConfig(name)?.animal);
}

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
      : (config.appearanceChanceByTerrain[terrain] ?? 0);
    return chance > 0;
  });

  if (candidates.length === 0) return raiderEnemyConfig;

  const totalChance = candidates.reduce(
    (sum, config) =>
      sum +
      (elite
        ? (config.eliteAppearanceChance ?? 0)
        : (config.appearanceChanceByTerrain[terrain] ?? 0)),
    0,
  );

  let cursor = roll * totalChance;
  for (const config of candidates) {
    const chance = elite
      ? (config.eliteAppearanceChance ?? 0)
      : (config.appearanceChanceByTerrain[terrain] ?? 0);
    cursor -= chance;
    if (cursor <= 0) return config;
  }

  return candidates[candidates.length - 1] ?? raiderEnemyConfig;
}
