import { t } from '../i18n';
import { TREASURE_GOBLIN_BALANCE } from './config';
import { hexKey, hexesInRange, type HexCoord } from './hex';
import { addLog } from './logs';
import { createRng } from './random';
import { isPassable } from './shared';
import { getTileAt } from './stateWorldQueries';
import type { CombatEnemyEncounterState, Enemy, GameState } from './types';
import { isWorldBossFootprint } from './worldBoss';

export function createCombatEnemyEncounterState(
  state: Pick<GameState, 'seed' | 'enemies'>,
  enemyId: string,
  encounterSeed: number,
): CombatEnemyEncounterState {
  const enemy = state.enemies[enemyId];
  if (!enemy || !isTreasureGoblinEnemy(enemy)) {
    return {};
  }

  const minHits = TREASURE_GOBLIN_BALANCE.fleeHitsMin;
  const maxHits = TREASURE_GOBLIN_BALANCE.fleeHitsMax;
  const fleeHitsRequired =
    minHits +
    Math.floor(
      createRng(
        `${state.seed}:combat:treasure-goblin:${encounterSeed}:${enemyId}`,
      )() *
        (maxHits - minHits + 1),
    );

  return {
    treasureGoblin: {
      damageHitsTaken: 0,
      fleeHitsRequired,
    },
  };
}

export function isTreasureGoblinEnemy(enemy: Enemy) {
  return enemy.enemyTypeId === 'treasure-goblin';
}

export function findTreasureGoblinEscapeCoord(
  state: Pick<GameState, 'seed' | 'tiles' | 'player' | 'combat'>,
  enemy: Enemy,
) {
  if (!state.combat) return null;

  const candidates = hexesInRange(
    enemy.coord,
    TREASURE_GOBLIN_BALANCE.fleeRadius,
  )
    .filter((coord) => isValidTreasureGoblinEscapeCoord(state, coord))
    .sort(compareHexCoords);
  if (candidates.length === 0) {
    return null;
  }

  const rng = createRng(
    `${state.seed}:combat:treasure-goblin:escape:${state.combat.startedAtMs ?? 0}:${enemy.id}`,
  );
  return candidates[Math.floor(rng() * candidates.length)] ?? null;
}

export function recordTreasureGoblinDamageHits(
  state: GameState,
  enemy: Enemy,
  hitCount = 1,
) {
  if (!state.combat || hitCount <= 0 || !isTreasureGoblinEnemy(enemy)) {
    return false;
  }

  const treasureGoblinState =
    state.combat.enemyStateById[enemy.id]?.treasureGoblin;
  if (!treasureGoblinState) {
    return false;
  }

  treasureGoblinState.damageHitsTaken += hitCount;
  if (
    enemy.hp <= 0 ||
    treasureGoblinState.damageHitsTaken < treasureGoblinState.fleeHitsRequired
  ) {
    return false;
  }

  const escapeCoord = findTreasureGoblinEscapeCoord(state, enemy);
  if (!escapeCoord) {
    return false;
  }

  moveTreasureGoblinToCoord(state, enemy, escapeCoord);
  addLog(state, 'combat', t('game.message.fled'));
  endCombatAfterTreasureGoblinEscape(state);
  return true;
}

function isValidTreasureGoblinEscapeCoord(
  state: Pick<GameState, 'seed' | 'tiles' | 'player'>,
  coord: HexCoord,
) {
  if (coord.q === state.player.coord.q && coord.r === state.player.coord.r) {
    return false;
  }

  const tile = getTileAt(state, coord);
  return (
    isPassable(tile.terrain) &&
    !tile.claim &&
    !tile.structure &&
    tile.enemyIds.length === 0 &&
    !isWorldBossFootprint(state.seed, coord)
  );
}

function moveTreasureGoblinToCoord(
  state: Pick<GameState, 'seed' | 'tiles'>,
  enemy: Enemy,
  coord: HexCoord,
) {
  const previousKey = hexKey(enemy.coord);
  const nextKey = hexKey(coord);
  const previousTile = getTileAt(state, enemy.coord);
  const nextTile = getTileAt(state, coord);

  state.tiles[previousKey] = {
    ...previousTile,
    enemyIds: previousTile.enemyIds.filter((enemyId) => enemyId !== enemy.id),
  };
  state.tiles[nextKey] = {
    ...nextTile,
    enemyIds: [...nextTile.enemyIds, enemy.id],
  };
  enemy.coord = coord;
}

function endCombatAfterTreasureGoblinEscape(state: GameState) {
  if (!state.combat) {
    return;
  }

  state.combat = null;
  addLog(state, 'combat', t('game.message.combat.over'));
}

function compareHexCoords(a: HexCoord, b: HexCoord) {
  if (a.q !== b.q) return a.q - b.q;
  return a.r - b.r;
}
