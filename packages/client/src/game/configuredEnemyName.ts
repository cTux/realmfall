import { getEnemyConfig } from './content/enemies';

export function normalizeConfiguredEnemyName(
  name: string,
  enemyTypeId?: string,
) {
  if (enemyTypeId && name === `game.enemy.${enemyTypeId}.name`) {
    return getEnemyConfig(enemyTypeId)?.name ?? name;
  }

  return name;
}
