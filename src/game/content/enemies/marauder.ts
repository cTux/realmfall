import { ContentIcons } from '../icons';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const marauderEnemyConfig: EnemyConfig = {
  name: enemyName('marauder'),
  icon: ContentIcons.HornedHelm,
  tint: 0xa855f7,
  appearanceChanceByTerrain: {
    forest: 0,
    desert: 0.5,
    swamp: 0,
    plains: 0.33,
  },
  eliteAppearanceChance: 0.5,
};
