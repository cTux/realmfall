import type { Terrain } from '../../types';
import { getTerrainContentTerrain } from '../../worldTerrain';
import { GAME_TAGS, uniqueTags, type GameTag } from '../tags';
import { boarEnemyConfig } from './boar';
import { gluttonyEnemyConfig } from './gluttony';
import { marauderEnemyConfig } from './marauder';
import { raiderEnemyConfig } from './raider';
import { spiderEnemyConfig } from './spider';
import { stagEnemyConfig } from './stag';
import { wolfEnemyConfig } from './wolf';

const RAW_ENEMY_CONFIGS = [
  gluttonyEnemyConfig,
  raiderEnemyConfig,
  marauderEnemyConfig,
  wolfEnemyConfig,
  boarEnemyConfig,
  stagEnemyConfig,
  spiderEnemyConfig,
] as const;

export const ENEMY_CONFIGS = RAW_ENEMY_CONFIGS.map((config) => ({
  ...config,
  tags: buildEnemyTags(config),
}));

const ENEMY_CONFIG_BY_ID = Object.fromEntries(
  ENEMY_CONFIGS.map((config) => [config.id, config]),
);

export function getEnemyConfig(enemyTypeId: string) {
  return ENEMY_CONFIG_BY_ID[enemyTypeId];
}

export function isAnimalEnemyType(enemyTypeId: string) {
  return (
    getEnemyConfig(enemyTypeId)?.tags.includes(GAME_TAGS.enemy.animal) ?? false
  );
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

function buildEnemyTags(config: (typeof RAW_ENEMY_CONFIGS)[number]) {
  const typedTags: Partial<Record<string, GameTag[]>> = {
    raider: [GAME_TAGS.enemy.humanoid],
    marauder: [GAME_TAGS.enemy.humanoid],
    spider: [GAME_TAGS.enemy.beast],
    wolf: [GAME_TAGS.enemy.beast],
    boar: [GAME_TAGS.enemy.beast],
    stag: [GAME_TAGS.enemy.beast],
    gluttony: [GAME_TAGS.enemy.aberration],
  };

  return uniqueTags(
    GAME_TAGS.enemy.hostile,
    config.animal ? GAME_TAGS.enemy.animal : undefined,
    config.worldBoss ? GAME_TAGS.enemy.worldBoss : undefined,
    ...(typedTags[config.id] ?? []),
  );
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
