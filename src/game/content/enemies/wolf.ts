import { ContentIcons } from '../icons';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const wolfEnemyConfig: EnemyConfig = {
  name: enemyName('wolf'),
  icon: ContentIcons.Enemy,
  tint: 0x60a5fa,
  appearanceChanceByTerrain: {
    forest: 0.28,
    swamp: 0.25,
  },
  animal: true,
};
