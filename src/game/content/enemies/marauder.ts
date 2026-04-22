import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const marauderEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Marauder,
  name: enemyName('marauder'),
  icon: ContentIcons.Marauder,
  tint: 0xa855f7,
  appearanceChanceByTerrain: {
    forest: 0,
    desert: 0.5,
    tundra: 0.12,
    highlands: 0.28,
    badlands: 0.44,
    swamp: 0,
    plains: 0.33,
  },
  eliteAppearanceChance: 0.5,
  tags: [],
};
