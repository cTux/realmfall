import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const spiderEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Spider,
  name: enemyName('spider'),
  icon: ContentIcons.Spider,
  tint: 0x8b5cf6,
  appearanceChanceByTerrain: {
    forest: 0.26,
    swamp: 0.35,
  },
  tags: buildEnemyTags({
    tags: [GAME_TAGS.enemy.beast],
  }),
};
