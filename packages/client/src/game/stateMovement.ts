import { t } from '../i18n';
import { hexDistance, type HexCoord } from './hex';
import { addLog } from './logs';
import { EnemyTypeId } from './content/ids';
import { GAME_CONFIG } from './config';
import { createRng } from './random';
import { enemyKey, makeEnemy, nextEnemySpawnIndex } from './combat';
import { isPassable } from './shared';
import { createCombatState } from './stateCombat';
import { cloneForWorldMutation, message } from './stateMutationHelpers';
import { getSafePathToTile } from './statePathfinding';
import { applySurvivalDecay, respawnAtNearestTown } from './stateSurvival';
import { getHostileEnemyIds } from './stateWorldQueries';
import type { GameState, Tile } from './types';
import { ensureTileState } from './world';

export function moveToTile(state: GameState, target: HexCoord): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const current = state.player.coord;
  if (hexDistance(current, target) !== 1) {
    return message(state, t('game.message.travel.oneHexAtATime'));
  }

  const next = cloneForWorldMutation(state);
  ensureTileState(next, target);
  const tile = next.tiles[`${target.q},${target.r}`]!;

  if (!isPassable(tile.terrain)) {
    return message(next, t('game.message.travel.blockedTerrain'));
  }

  next.turn += 1;
  applySurvivalDecay(next);
  next.player.coord = target;

  if (next.player.hp <= 0) {
    respawnAtNearestTown(next, target);
    return next;
  }

  trySpawnNightAmbush(next, target, tile);

  const hostileEnemyIds = getHostileEnemyIds(next, target);
  if (hostileEnemyIds.length > 0) {
    next.combat = createCombatState(
      next,
      target,
      hostileEnemyIds,
      next.worldTimeMs,
    );
    addLog(
      next,
      'combat',
      t(
        hostileEnemyIds.length === 1
          ? 'game.message.combat.encounter.one'
          : 'game.message.combat.encounter.other',
        { count: hostileEnemyIds.length },
      ),
    );
    return next;
  }

  addLog(
    next,
    'movement',
    t('game.message.travel.toHex', { q: target.q, r: target.r }),
  );
  return next;
}

export function moveAlongSafePath(
  state: GameState,
  target: HexCoord,
): GameState {
  const path = getSafePathToTile(state, target);
  if (!path || path.length === 0) {
    return path ? state : message(state, t('game.message.travel.noSafePath'));
  }

  let next = state;
  for (const step of path) {
    next = moveToTile(next, step);
    if (next === state || next.gameOver || next.combat) {
      return next;
    }
  }

  return next;
}

function trySpawnNightAmbush(next: GameState, coord: HexCoord, tile: Tile) {
  const chance = GAME_CONFIG.worldGeneration.ambush.chance;
  if (next.dayPhase !== 'night' || chance <= 0) return;
  if (!canSpawnNightAmbush(tile)) return;

  const rng = createRng(
    `${next.seed}:ambush:${next.turn}:${coord.q}:${coord.r}`,
  );
  if (rng() >= chance) return;

  const ambushIndex = nextEnemySpawnIndex(tile.enemyIds);
  const ambushEnemy = makeEnemy(
    next.seed,
    coord,
    tile.terrain,
    ambushIndex,
    tile.structure,
    next.bloodMoonActive,
    {
      enemyId: enemyKey(coord, ambushIndex),
      enemyTypeId: EnemyTypeId.Raider,
      rarity: 'common',
    },
  );

  tile.enemyIds.push(ambushEnemy.id);
  next.enemies[ambushEnemy.id] = ambushEnemy;

  addLog(
    next,
    'combat',
    t('game.message.combat.ambush.one', {
      enemy: t('game.enemy.raider.name'),
    }),
  );
}

function canSpawnNightAmbush(tile: Tile) {
  if (tile.claim) return false;
  if (tile.structure) return false;
  if (tile.enemyIds.length > 0) return false;
  return true;
}
