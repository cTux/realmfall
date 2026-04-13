import { ContentIcons } from '../icons';
import type { EnemyConfig } from '../types';

export const boarEnemyConfig: EnemyConfig = {
  name: 'Boar',
  icon: ContentIcons.Enemy,
  tint: 0xf59e0b,
  appearanceChanceByTerrain: {
    forest: 0.28,
    swamp: 0.35,
    plains: 0.33,
  },
  animal: true,
};
