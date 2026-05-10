import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const marauderEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Marauder,
  name: enemyName('marauder'),
  icon: ContentIcons.Marauder,
  tint: 0xa855f7,
  appearanceChanceByTerrain: {
    forest: 0,
    desert: 0.5,
    swamp: 0,
    plains: 0.33,
  },
  eliteAppearanceChance: 0.5,
  tags: buildEnemyTags({
    tags: [GAME_TAGS.enemy.humanoid],
  }),
};
