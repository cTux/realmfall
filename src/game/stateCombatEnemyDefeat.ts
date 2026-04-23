import { t } from '../i18n';
import { enemyDefeatedRichText } from './combatLogText';
import { BASE_ENEMY_XP } from './config';
import { addLog } from './logs';
import { gainXp } from './progression';
import { syncCombatEncounterEnemies } from './stateCombatEncounterSync';
import { dropEnemyRewards } from './stateRewards';
import type { GameState } from './types';

export function handleEnemyDefeat(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
) {
  if (!state.enemies[enemy.id]) return;

  gainXp(state, BASE_ENEMY_XP, addLog, enemy.tier);
  dropEnemyRewards(state, enemy);
  addLog(
    state,
    'combat',
    t('game.message.combat.enemyDefeated', { enemy: enemy.name }),
    enemyDefeatedRichText(enemy),
  );
  delete state.enemies[enemy.id];
  syncCombatEncounterEnemies(state);
}
