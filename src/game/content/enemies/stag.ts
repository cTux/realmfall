import { ContentIcons } from '../icons';
import { EnemyTypeId } from '../ids';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const stagEnemyConfig: EnemyConfig = {
  id: EnemyTypeId.Stag,
  name: enemyName('stag'),
  icon: ContentIcons.Stag,
  tint: 0x22c55e,
  appearanceChanceByTerrain: {
    plains: 0.34,
    forest: 0.18,
    tundra: 0.26,
    highlands: 0.14,
  },
  animal: true,
  tags: [],
};
