import { ContentIcons } from '../icons';
import type { EnemyConfig } from '../types';

export const wolfEnemyConfig: EnemyConfig = {
  name: 'Wolf',
  icon: ContentIcons.Enemy,
  tint: 0x60a5fa,
  appearanceChanceByTerrain: {
    forest: 0.28,
    swamp: 0.25,
  },
  animal: true,
};
