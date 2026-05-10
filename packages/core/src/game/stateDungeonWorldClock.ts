import {
  DUNGEON_ENEMY_CHASE_RADIUS,
  DUNGEON_ENEMY_SPAWN_LEASH_RADIUS,
  WORLD_MOVE_HEX_COOLDOWN_MS,
} from './config';
import { getActiveWorld } from './dungeons/worldState';
import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { createRng } from './random';
import { createCombatActorState } from './combat';
import {
  createPendingCombatEncounter,
  getCombatEncounterEnemyIds,
} from './stateCombatEngagement';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import { getHostileEnemyIds } from './stateWorldQueries';
import { isPassable } from './shared';
import type { Enemy, GameState } from './types';

export function shouldSyncActiveDungeonEnemyMovement(state: GameState) {
  const activeWorld = getActiveWorld(state);
  return (
    activeWorld?.kind === 'dungeon' &&
    !state.gameOver &&
    Object.keys(activeWorld.enemies).length > 0
  );
}

export function syncActiveDungeonEnemyMovement(state: GameState) {
  const activeWorld = getActiveWorld(state);
  if (!activeWorld || activeWorld.kind !== 'dungeon') {
    return false;
  }

  const initialHostileEnemyIds = getHostileEnemyIds(state, state.player.coord);
  if (initialHostileEnemyIds.length > 0) {
    startDungeonEnemyCombat(
      state,
      state.player.coord,
      initialHostileEnemyIds,
      null,
    );
    return true;
  }

  let changed = false;
  const involvedCombatEnemyIds = new Set(
    state.combat ? getCombatEncounterEnemyIds(state.combat) : [],
  );
  const orderedEnemyIds = Object.keys(activeWorld.enemies).sort(
    (left, right) => {
      const leftEnemy = activeWorld.enemies[left]!;
      const rightEnemy = activeWorld.enemies[right]!;
      const distanceDifference =
        hexDistance(leftEnemy.coord, state.player.coord) -
        hexDistance(rightEnemy.coord, state.player.coord);

      return distanceDifference || left.localeCompare(right);
    },
  );

  for (const enemyId of orderedEnemyIds) {
    if (enemyId === activeWorld.dungeon.finalEliteEnemyId) {
      continue;
    }

    if (involvedCombatEnemyIds.has(enemyId)) {
      continue;
    }

    const enemy = activeWorld.enemies[enemyId];
    if (!enemy) {
      continue;
    }

    if (enemy.dungeonMovementCooldownEndsAt !== undefined) {
      if (enemy.dungeonMovementCooldownEndsAt > state.worldTimeMs) {
        continue;
      }
    }

    if (enemy.dungeonSpawnCoord === undefined) {
      enemy.dungeonSpawnCoord = { ...enemy.coord };
      changed = true;
    }

    const target = pickDungeonEnemyMoveTarget(state, enemy);
    if (!target) {
      continue;
    }

    const previousCoord = { ...enemy.coord };
    if (sameCoord(target, state.player.coord)) {
      startDungeonEnemyCombat(
        state,
        state.player.coord,
        [
          enemy.id,
          ...getHostileEnemyIds(state, state.player.coord).filter(
            (hostileEnemyId) => hostileEnemyId !== enemy.id,
          ),
        ],
        previousCoord,
      );
      changed = true;
      break;
    }

    moveDungeonEnemy(state, enemy, target);
    changed = true;
  }

  return changed;
}

function pickDungeonEnemyMoveTarget(state: GameState, enemy: Enemy) {
  const currentDistanceToPlayer = hexDistance(enemy.coord, state.player.coord);
  const spawnCoord = enemy.dungeonSpawnCoord ?? enemy.coord;

  if (currentDistanceToPlayer <= DUNGEON_ENEMY_CHASE_RADIUS) {
    return getDungeonEnemyChaseStep(state, enemy);
  }

  const candidateNeighbors = getDungeonEnemyMoveCandidates(
    state,
    enemy,
    spawnCoord,
  );

  if (candidateNeighbors.length === 0) {
    return null;
  }

  const currentDistanceFromSpawn = hexDistance(enemy.coord, spawnCoord);
  if (currentDistanceFromSpawn >= DUNGEON_ENEMY_SPAWN_LEASH_RADIUS) {
    const inwardCandidates = candidateNeighbors.sort((left, right) => {
      const distanceDifference =
        hexDistance(left, spawnCoord) - hexDistance(right, spawnCoord);
      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return compareCoords(left, right);
    });

    return inwardCandidates[0] ?? null;
  }

  return (
    shuffleCoords(
      candidateNeighbors,
      `${state.seed}:dungeon-move:${enemy.id}:${Math.floor(state.worldTimeMs / WORLD_MOVE_HEX_COOLDOWN_MS)}`,
    )[0] ?? null
  );
}

function getDungeonEnemyChaseStep(state: GameState, enemy: Enemy) {
  if (sameCoord(enemy.coord, state.player.coord)) {
    return null;
  }

  const visited = new Set([hexKey(enemy.coord)]);
  const queue: Array<{ coord: HexCoord; firstStep: HexCoord | null }> = [
    { coord: enemy.coord, firstStep: null },
  ];

  for (let index = 0; index < queue.length; index += 1) {
    const next = queue[index];
    if (!next) {
      continue;
    }

    const neighbors = hexNeighbors(next.coord).sort((left, right) => {
      const distanceDifference =
        hexDistance(left, state.player.coord) -
        hexDistance(right, state.player.coord);
      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return compareCoords(left, right);
    });

    for (const neighbor of neighbors) {
      const key = hexKey(neighbor);
      if (visited.has(key)) {
        continue;
      }

      if (
        !canDungeonEnemyMoveToCoord(state, enemy, neighbor, {
          ignoreSpawnLeash: true,
        })
      ) {
        continue;
      }

      const firstStep = next.firstStep ?? neighbor;
      if (sameCoord(neighbor, state.player.coord)) {
        return firstStep;
      }

      visited.add(key);
      queue.push({
        coord: neighbor,
        firstStep,
      });
    }
  }

  return null;
}

function getDungeonEnemyMoveCandidates(
  state: GameState,
  enemy: Enemy,
  spawnCoord: HexCoord,
) {
  return hexNeighbors(enemy.coord).filter((coord) =>
    canDungeonEnemyMoveToCoord(state, enemy, coord, { spawnCoord }),
  );
}

function canDungeonEnemyMoveToCoord(
  state: GameState,
  enemy: Enemy,
  coord: HexCoord,
  {
    ignoreSpawnLeash = false,
    spawnCoord = enemy.dungeonSpawnCoord ?? enemy.coord,
  }: {
    ignoreSpawnLeash?: boolean;
    spawnCoord?: HexCoord;
  } = {},
) {
  const targetTile = state.tiles[hexKey(coord)];
  if (!targetTile || !isPassable(targetTile.terrain)) {
    return false;
  }

  const isPlayerTile = sameCoord(coord, state.player.coord);
  if (
    !isPlayerTile &&
    (targetTile.structure === 'dungeon' ||
      targetTile.structure === 'dungeon-chest')
  ) {
    return false;
  }

  if (
    !isPlayerTile &&
    targetTile.enemyIds.some((targetEnemyId) => targetEnemyId !== enemy.id)
  ) {
    return false;
  }

  return (
    ignoreSpawnLeash ||
    hexDistance(coord, spawnCoord) <= DUNGEON_ENEMY_SPAWN_LEASH_RADIUS
  );
}

function moveDungeonEnemy(state: GameState, enemy: Enemy, target: HexCoord) {
  const currentTile = state.tiles[hexKey(enemy.coord)];
  const nextTile = state.tiles[hexKey(target)];
  if (!currentTile || !nextTile) {
    return;
  }

  currentTile.enemyIds = currentTile.enemyIds.filter(
    (enemyId) => enemyId !== enemy.id,
  );
  nextTile.enemyIds.push(enemy.id);
  enemy.coord = { ...target };
  enemy.dungeonMovementCooldownEndsAt =
    state.worldTimeMs + WORLD_MOVE_HEX_COOLDOWN_MS;
}

function startDungeonEnemyCombat(
  state: GameState,
  coord: HexCoord,
  hostileEnemyIds: string[],
  targetCoord: HexCoord | null = coord,
) {
  if (hostileEnemyIds.length === 0) {
    return;
  }

  if (state.combat) {
    const existingEnemyIds = new Set([
      ...state.combat.enemyIds,
      ...(state.combat.queuedEnemyIds ?? []),
    ]);
    const newEnemyIds = hostileEnemyIds.filter(
      (enemyId) => !existingEnemyIds.has(enemyId),
    );
    if (newEnemyIds.length === 0) {
      return;
    }

    if (!state.combat.started) {
      state.combat.enemyIds.push(...newEnemyIds);
    } else {
      state.combat.queuedEnemyIds = [
        ...(state.combat.queuedEnemyIds ?? []),
        ...newEnemyIds,
      ];
    }

    const encounterSeed = state.combat.startedAtMs ?? state.worldTimeMs;
    newEnemyIds.forEach((enemyId) => {
      state.combat!.enemies[enemyId] ??= createCombatActorState(
        state.worldTimeMs,
        state.enemies[enemyId]?.abilityIds,
      );
      state.combat!.enemyStateById[enemyId] ??= createCombatEnemyEncounterState(
        state,
        enemyId,
        encounterSeed,
      );
    });
    return;
  }

  state.combat = createPendingCombatEncounter(state, {
    autoStepOnVictory: false,
    engageMode: 'enemy-chase',
    enemyIds: hostileEnemyIds,
    originCoord: coord,
    stagingCoord: coord,
    targetCoord,
    worldTimeMs: state.worldTimeMs,
  });
}

function shuffleCoords(coords: HexCoord[], seed: string) {
  const shuffled = [...coords];
  const rng = createRng(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex]!,
      shuffled[index]!,
    ];
  }

  return shuffled;
}

function compareCoords(left: HexCoord, right: HexCoord) {
  return left.q - right.q || left.r - right.r;
}

function sameCoord(left: HexCoord, right: HexCoord) {
  return left.q === right.q && left.r === right.r;
}
