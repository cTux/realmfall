import { ContentIcons } from '../icons';
import type { EnemyConfig } from '../types';

export const spiderEnemyConfig: EnemyConfig = {
  name: 'Spider',
  icon: ContentIcons.Spider,
  tint: 0x8b5cf6,
  appearanceChanceByTerrain: {
    forest: 0.26,
    swamp: 0.35,
  },
};
