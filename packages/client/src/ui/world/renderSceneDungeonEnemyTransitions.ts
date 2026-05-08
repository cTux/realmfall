import { WORLD_MOVE_VISUAL_DURATION_MS } from '../../game/config';
import { getActiveWorld } from '../../game/dungeons/worldState';
import { hexDistance, type HexCoord } from '../../game/hex';
import type { Enemy, GameState } from '../../game/stateTypes';
import { tileToPoint } from './renderSceneMath';
import type { SceneCache } from './renderSceneCache';
import type { AnimatedWorldMarkerMovementTransition } from './renderSceneMarkerAnimations';

export interface DungeonEnemyMovementTransition {
  durationMs: number;
  fromCoord: HexCoord;
  startedAtMs: number;
  toCoord: HexCoord;
}

export function syncDungeonEnemyMovementTransitions(
  scene: SceneCache,
  state: GameState,
  animationMs: number,
) {
  const activeWorld = getActiveWorld(state);
  if (!activeWorld || activeWorld.kind !== 'dungeon') {
    clearDungeonEnemyMovementTransitionState(scene);
    return;
  }

  if (scene.dungeonEnemyTransitionWorldId !== activeWorld.id) {
    scene.dungeonEnemyTransitionWorldId = activeWorld.id;
    scene.dungeonEnemyLastCoordsById = captureDungeonEnemyCoords(state.enemies);
    scene.dungeonEnemyMovementTransitionsByEnemyId.clear();
    return;
  }

  pruneExpiredDungeonEnemyMovementTransitions(scene, state, animationMs);

  Object.values(state.enemies).forEach((enemy) => {
    const previousCoord = scene.dungeonEnemyLastCoordsById.get(enemy.id);
    if (!previousCoord || sameCoord(previousCoord, enemy.coord)) {
      return;
    }

    if (
      hexDistance(previousCoord, enemy.coord) !== 1 ||
      enemy.dungeonMovementCooldownEndsAt === undefined ||
      enemy.dungeonMovementCooldownEndsAt <= state.worldTimeMs
    ) {
      scene.dungeonEnemyMovementTransitionsByEnemyId.delete(enemy.id);
      return;
    }

    scene.dungeonEnemyMovementTransitionsByEnemyId.set(enemy.id, {
      durationMs: WORLD_MOVE_VISUAL_DURATION_MS,
      fromCoord: { ...previousCoord },
      startedAtMs: animationMs,
      toCoord: { ...enemy.coord },
    });
  });

  scene.dungeonEnemyLastCoordsById = captureDungeonEnemyCoords(state.enemies);
}

export function getDungeonEnemyAnimatedMovementTransition({
  enemy,
  hexSize,
  scene,
}: {
  enemy: Enemy;
  hexSize: number;
  scene: SceneCache;
}) {
  const transition = scene.dungeonEnemyMovementTransitionsByEnemyId.get(
    enemy.id,
  );
  if (!transition || !sameCoord(transition.toCoord, enemy.coord)) {
    return undefined;
  }

  const offsetAtStart = tileToPoint(
    {
      q: transition.fromCoord.q - transition.toCoord.q,
      r: transition.fromCoord.r - transition.toCoord.r,
    },
    0,
    0,
    hexSize,
  );

  return {
    durationMs: transition.durationMs,
    offsetAtStart,
    startedAtMs: transition.startedAtMs,
  } satisfies AnimatedWorldMarkerMovementTransition;
}

function clearDungeonEnemyMovementTransitionState(scene: SceneCache) {
  scene.dungeonEnemyTransitionWorldId = null;
  scene.dungeonEnemyLastCoordsById.clear();
  scene.dungeonEnemyMovementTransitionsByEnemyId.clear();
}

function captureDungeonEnemyCoords(enemies: GameState['enemies']) {
  return new Map(
    Object.values(enemies).map(
      (enemy) => [enemy.id, { ...enemy.coord }] as const,
    ),
  );
}

function pruneExpiredDungeonEnemyMovementTransitions(
  scene: SceneCache,
  state: GameState,
  animationMs: number,
) {
  [...scene.dungeonEnemyMovementTransitionsByEnemyId.entries()].forEach(
    ([enemyId, transition]) => {
      const enemy = state.enemies[enemyId];
      if (
        !enemy ||
        !sameCoord(enemy.coord, transition.toCoord) ||
        animationMs >= transition.startedAtMs + transition.durationMs
      ) {
        scene.dungeonEnemyMovementTransitionsByEnemyId.delete(enemyId);
      }
    },
  );
}

function sameCoord(left: HexCoord, right: HexCoord) {
  return left.q === right.q && left.r === right.r;
}
