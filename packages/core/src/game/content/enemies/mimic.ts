import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const mimicEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Mimic,
  name: enemyName('mimic'),
  icon: ContentIcons.LockedChest,
  tint: 0xfbbf24,
  appearanceChanceByTerrain: {},
  tags: buildEnemyTags({
    tags: [GAME_TAGS.enemy.aberration, GAME_TAGS.enemy.mimic],
  }),
};
