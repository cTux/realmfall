import { ContentIcons } from '../icons';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const gluttonyEnemyConfig: EnemyConfig = {
  name: enemyName('gluttony'),
  icon: ContentIcons.Gluttony,
  tint: 0xf59e0b,
  appearanceChanceByTerrain: {},
  worldBoss: true,
};
