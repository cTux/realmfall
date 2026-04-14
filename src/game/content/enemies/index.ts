import type { Terrain } from '../../types';
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

const ENEMY_CONFIG_BY_NAME = Object.fromEntries(
  ENEMY_CONFIGS.map((config) => [config.name, config]),
);

export function getEnemyConfig(enemyTypeIdOrName: string) {
  return (
    ENEMY_CONFIG_BY_ID[enemyTypeIdOrName] ??
    ENEMY_CONFIG_BY_NAME[enemyTypeIdOrName]
  );
}

export function getEnemyConfigById(enemyTypeId: string) {
  return ENEMY_CONFIG_BY_ID[enemyTypeId];
}

export function isAnimalEnemyType(enemyTypeIdOrName: string) {
  return (
    getEnemyConfig(enemyTypeIdOrName)?.tags.includes(GAME_TAGS.enemy.animal) ??
    false
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
