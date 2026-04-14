import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const boarEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Boar,
  name: enemyName('boar'),
  icon: ContentIcons.Enemy,
  tint: 0xf59e0b,
  appearanceChanceByTerrain: {
    forest: 0.28,
    swamp: 0.35,
    plains: 0.33,
  },
  animal: true,
  tags: [],
};
