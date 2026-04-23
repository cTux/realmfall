import { GAME_TAGS } from '../tags';
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

export const ENEMY_CONFIGS = [...RAW_ENEMY_CONFIGS];

const ENEMY_CONFIG_BY_ID = Object.fromEntries(
  ENEMY_CONFIGS.map((config) => [config.id, config]),
);

export function getEnemyConfig(enemyTypeId: string) {
  return ENEMY_CONFIG_BY_ID[enemyTypeId];
}

export function isAnimalEnemyType(enemyTypeId: string) {
  return (getEnemyConfig(enemyTypeId)?.tags ?? []).includes(
    GAME_TAGS.enemy.animal,
  );
}
