import { ContentIcons } from '../icons';
import { enemyName } from '../i18n';
import type { EnemyConfig } from '../types';

export const raiderEnemyConfig: EnemyConfig = {
  name: enemyName('raider'),
  icon: ContentIcons.Hood,
  tint: 0xef4444,
  appearanceChanceByTerrain: {
    forest: 0.18,
    desert: 0.5,
    swamp: 0,
    plains: 0,
  },
  eliteAppearanceChance: 0.5,
};
