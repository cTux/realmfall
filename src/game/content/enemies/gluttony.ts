import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const gluttonyEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Gluttony,
  name: enemyName('gluttony'),
  icon: ContentIcons.Gluttony,
  tint: 0xf59e0b,
  appearanceChanceByTerrain: {},
  worldBoss: true,
  tags: buildEnemyTags({
    worldBoss: true,
    tags: [GAME_TAGS.enemy.aberration],
  }),
};
