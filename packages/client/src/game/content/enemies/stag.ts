import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const stagEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Stag,
  name: enemyName('stag'),
  icon: ContentIcons.Stag,
  tint: 0x22c55e,
  appearanceChanceByTerrain: {
    plains: 0.34,
  },
  animal: true,
  tags: buildEnemyTags({
    animal: true,
    tags: [GAME_TAGS.enemy.beast],
  }),
};
