import { ContentIcons } from '../icons';
import type { EnemyConfig } from '../types';

export const stagEnemyConfig: EnemyConfig = {
  name: 'Stag',
  icon: ContentIcons.Enemy,
  tint: 0x22c55e,
  appearanceChanceByTerrain: {
    plains: 0.34,
  },
  animal: true,
};
