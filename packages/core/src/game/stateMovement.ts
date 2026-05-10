import { t } from '../i18n';
import { EnemyTypeId } from './content/ids';
import { enemyKey, makeEnemy, nextEnemySpawnIndex } from './combat';
import { GAME_CONFIG } from './config';
import { hexDistance, type HexCoord } from './hex';
import { addLog } from './logs';
import { createRng } from './random';
import { isPassable } from './shared';
import {
  createPendingCombatEncounter,
  createStartedCombatEncounter,
} from './stateCombatEngagement';
import { cloneForWorldMutation, message } from './stateMutationHelpers';
import { getSafePathToTile } from './statePathfinding';
import { applySurvivalDecay, respawnAtNearestTown } from './stateSurvival';
import { getHostileEnemyIds, getResolvedTileAt } from './stateWorldQueries';
import type { CombatEngagementMetadata, GameState, Tile } from './types';

export interface MoveToTileOptions {
  engageMode?: Extract<
    CombatEngagementMetadata['engageMode'],
    'adjacent-click' | 'staged-click'
  >;
  engageTargetCoord?: HexCoord;
}

export function moveToTile(
  state: GameState,
  target: HexCoord,
  options: MoveToTileOptions = {},
): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const current = state.player.coord;
  if (hexDistance(current, target) !== 1) {
    return message(state, t('game.message.travel.oneHexAtATime'));
  }

  const next = cloneForWorldMutation(state);
  const tile = getResolvedTileAt(next, target);
  if (!tile) {
    return message(next, t('game.message.travel.unknownHex'));
  }

  if (!isPassable(tile.terrain)) {
    return message(next, t('game.message.travel.blockedTerrain'));
  }

  const adjacentHostileEngagement =
    options.engageMode === 'adjacent-click' &&
    options.engageTargetCoord !== undefined
      ? getHostileEnemyIds(next, options.engageTargetCoord)
      : [];
  if (adjacentHostileEngagement.length > 0) {
    const adjacentTargetCoord = options.engageTargetCoord!;
    const combat = createPendingCombatEncounter(next, {
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      enemyIds: adjacentHostileEngagement,
      originCoord: current,
      stagingCoord: current,
      targetCoord: adjacentTargetCoord,
      worldTimeMs: next.worldTimeMs,
    });
    if (combat) {
      combat.coord = { ...adjacentTargetCoord };
    }
    next.combat = combat;
    return next;
  }

  next.turn += 1;
  applySurvivalDecay(next);
  next.player.coord = target;

  if (next.player.hp <= 0) {
    respawnAtNearestTown(next, target);
    return next;
  }

  const currentTile = getResolvedTileAt(next, target);
  if (!currentTile) {
    return next;
  }

  trySpawnNightAmbush(next, target, currentTile);

  const hostileEnemyIds = getHostileEnemyIds(next, target);
  if (hostileEnemyIds.length > 0) {
    next.combat = createStartedCombatEncounter(next, {
      autoStepOnVictory: false,
      engageMode: 'tile-step',
      enemyIds: hostileEnemyIds,
      originCoord: current,
      stagingCoord: target,
      targetCoord: target,
      worldTimeMs: next.worldTimeMs,
    });
    return next;
  }

  const stagedHostileTarget: HexCoord | null =
    options.engageMode === 'staged-click' &&
    options.engageTargetCoord !== undefined
      ? options.engageTargetCoord
      : null;
  const stagedHostileEnemyIds =
    stagedHostileTarget === null
      ? []
      : getHostileEnemyIds(next, stagedHostileTarget);
  if (stagedHostileTarget !== null && stagedHostileEnemyIds.length > 0) {
    const combat = createPendingCombatEncounter(next, {
      autoStepOnVictory: true,
      engageMode: 'staged-click',
      enemyIds: stagedHostileEnemyIds,
      originCoord: current,
      stagingCoord: target,
      targetCoord: stagedHostileTarget,
      worldTimeMs: next.worldTimeMs,
    });
    if (combat) {
      combat.coord = { ...stagedHostileTarget };
    }
    next.combat = combat;
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
    const endedOnStep =
      next.player.coord.q === step.q && next.player.coord.r === step.r;
    if (!endedOnStep || next.gameOver || next.combat) {
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
