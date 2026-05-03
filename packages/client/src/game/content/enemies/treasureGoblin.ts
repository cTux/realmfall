import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const treasureGoblinEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.TreasureGoblin,
  name: enemyName('treasure-goblin'),
  icon: ContentIcons.TreasureGoblin,
  tint: 0xfbbf24,
  appearanceChanceByTerrain: {},
  tags: buildEnemyTags({
    tags: [GAME_TAGS.enemy.humanoid, GAME_TAGS.enemy.treasureGoblin],
  }),
};
