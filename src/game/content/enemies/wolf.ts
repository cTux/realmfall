import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const wolfEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Wolf,
  name: enemyName('wolf'),
  icon: ContentIcons.Enemy,
  tint: 0x60a5fa,
  appearanceChanceByTerrain: {
    forest: 0.28,
    swamp: 0.25,
  },
  animal: true,
  tags: buildEnemyTags({
    animal: true,
    tags: [GAME_TAGS.enemy.beast],
  }),
};
