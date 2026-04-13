import { ContentIcons } from '../icons';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const spiderEnemyConfig: EnemyConfig = {
  name: enemyName('spider'),
  icon: ContentIcons.Spider,
  tint: 0x8b5cf6,
  appearanceChanceByTerrain: {
    forest: 0.26,
    swamp: 0.35,
  },
};
