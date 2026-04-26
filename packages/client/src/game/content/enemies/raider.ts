import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import { GAME_TAGS } from '../tags';
import type { EnemyConfig } from '../types';
import { buildEnemyTags } from './enemyTagRules';

export const raiderEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Raider,
  name: enemyName('raider'),
  icon: ContentIcons.Raider,
  tint: 0xef4444,
  appearanceChanceByTerrain: {
    forest: 0.18,
    desert: 0.5,
    swamp: 0,
    plains: 0,
  },
  eliteAppearanceChance: 0.5,
  tags: buildEnemyTags({
    tags: [GAME_TAGS.enemy.humanoid],
  }),
};
