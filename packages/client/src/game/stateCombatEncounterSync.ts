import { t } from '../i18n';
import { createCombatActorState } from './combat';
import { hexKey } from './hex';
import { addLog } from './logs';
import type { GameState } from './types';
import { buildTile, normalizeStructureState } from './world';

export function syncCombatEncounterEnemies(state: GameState) {
  if (!state.combat) return;

  const tile =
    state.tiles[hexKey(state.combat.coord)] ??
    buildTile(state.seed, state.combat.coord);
  const enemyIds = tile.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );

  state.tiles[hexKey(state.combat.coord)] = normalizeStructureState({
    ...tile,
    enemyIds,
  });

  const worldTimeMs = state.worldTimeMs;
  state.combat.enemies = Object.fromEntries(
    enemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );
  state.combat.enemyIds = enemyIds;

  if (enemyIds.length === 0) {
    state.combat = null;
    addLog(state, 'combat', t('game.message.combat.over'));
  }
}
