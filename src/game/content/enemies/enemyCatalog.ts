import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
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

export const ENEMY_CONFIGS: EnemyConfig[] = RAW_ENEMY_CONFIGS.map((config) =>
  localizeEnemyConfig({ ...config }),
);

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

function localizeEnemyConfig(config: EnemyConfig) {
  defineLocalizedProperty(config, 'name', () => enemyName(config.id));

  return config;
}

function defineLocalizedProperty<T extends object, K extends keyof T>(
  target: T,
  key: K,
  resolve: () => NonNullable<T[K]>,
) {
  let override: T[K] | undefined;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get: () => override ?? resolve(),
    set: (value: T[K]) => {
      override = value;
    },
  });
}
