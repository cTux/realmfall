import { ENEMY_CONFIGS } from '../game/content/enemies';
import type { Enemy } from '../game/stateTypes';

const LEGACY_ENEMY_TYPE_ID_BY_NAME = Object.fromEntries(
  ENEMY_CONFIGS.map((config) => [config.name, config.id]),
) as Record<string, NonNullable<Enemy['enemyTypeId']>>;

export function resolveLegacyEnemyTypeId(
  name: unknown,
): NonNullable<Enemy['enemyTypeId']> | null {
  return typeof name === 'string'
    ? (LEGACY_ENEMY_TYPE_ID_BY_NAME[name] ?? null)
    : null;
}
