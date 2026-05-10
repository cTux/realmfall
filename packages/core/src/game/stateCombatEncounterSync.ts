import { t } from '../i18n';
import { createCombatActorState } from './combat';
import { clearConsumableCooldownIfOutOfCombat } from './combatActivity';
import { hexKey } from './hex';
import { addLog } from './logs';
import {
  applyCombatVictoryAutoStep,
  getCombatEncounterEnemyIds,
  getCombatEncounterCoord,
} from './stateCombatEngagement';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import type { GameState } from './types';
import { buildTileForState, normalizeStructureState } from './world';

export function syncCombatEncounterEnemies(state: GameState) {
  if (!state.combat) return;

  const activeEnemyIds = state.combat.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );
  const queuedEnemyIds = (state.combat.queuedEnemyIds ?? []).filter(
    (enemyId) =>
      Boolean(state.enemies[enemyId]) && !activeEnemyIds.includes(enemyId),
  );
  const liveCombatEnemyIds = [...activeEnemyIds, ...queuedEnemyIds];
  const involvedTileKeys = new Set(
    liveCombatEnemyIds.map((enemyId) => hexKey(state.enemies[enemyId]!.coord)),
  );
  involvedTileKeys.add(hexKey(getCombatEncounterCoord(state.combat)));

  for (const tileKey of involvedTileKeys) {
    const tile =
      state.tiles[tileKey] ?? buildTileForState(state, parseHexKey(tileKey));
    state.tiles[tileKey] = normalizeStructureState({
      ...tile,
      enemyIds: tile.enemyIds.filter((enemyId) =>
        Boolean(state.enemies[enemyId]),
      ),
    });
  }

  const worldTimeMs = state.worldTimeMs;
  const encounterSeed = state.combat.startedAtMs ?? worldTimeMs;
  state.combat.enemies = Object.fromEntries(
    liveCombatEnemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );
  state.combat.enemyStateById = Object.fromEntries(
    liveCombatEnemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemyStateById[enemyId] ??
        createCombatEnemyEncounterState(state, enemyId, encounterSeed),
    ]),
  );
  state.combat.enemyIds = activeEnemyIds;
  state.combat.queuedEnemyIds = queuedEnemyIds;

  if (getCombatEncounterEnemyIds(state.combat).length === 0) {
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

function parseHexKey(key: string) {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}
