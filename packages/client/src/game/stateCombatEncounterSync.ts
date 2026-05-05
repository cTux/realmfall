import { t } from '../i18n';
import { createCombatActorState } from './combat';
import { clearConsumableCooldownIfOutOfCombat } from './combatActivity';
import { hexKey } from './hex';
import { addLog } from './logs';
import { applyCombatVictoryAutoStep } from './stateCombatEngagement';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import type { GameState } from './types';
import { buildTileForState, normalizeStructureState } from './world';

export function syncCombatEncounterEnemies(state: GameState) {
  if (!state.combat) return;

  const tile =
    state.tiles[hexKey(state.combat.coord)] ??
    buildTileForState(state, state.combat.coord);
  const enemyIds = tile.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );

  state.tiles[hexKey(state.combat.coord)] = normalizeStructureState({
    ...tile,
    enemyIds,
  });

  const worldTimeMs = state.worldTimeMs;
  const encounterSeed = state.combat.startedAtMs ?? worldTimeMs;
  state.combat.enemies = Object.fromEntries(
    enemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );
  state.combat.enemyStateById = Object.fromEntries(
    enemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemyStateById[enemyId] ??
        createCombatEnemyEncounterState(state, enemyId, encounterSeed),
    ]),
  );
  state.combat.enemyIds = enemyIds;

  if (enemyIds.length === 0) {
    const moved = applyCombatVictoryAutoStep(state);
    state.combat = null;
    clearConsumableCooldownIfOutOfCombat(state);
    addLog(state, 'combat', t('game.message.combat.over'));
    if (moved) {
      addLog(
        state,
        'movement',
        t('game.message.travel.toHex', {
          q: state.player.coord.q,
          r: state.player.coord.r,
        }),
      );
    }
  }
}
