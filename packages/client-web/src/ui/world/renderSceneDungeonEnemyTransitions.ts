import { WORLD_MOVE_VISUAL_DURATION_MS } from '@realmfall/core/game/config';
import { getActiveWorld } from '@realmfall/core/game/dungeons/worldState';
import type { HexCoord } from '@realmfall/core/game/hex';
import type { Enemy, GameState } from '@realmfall/core/game/stateTypes';
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
    scene.dungeonEnemyMovementTransitionsByEnemyId.clear();
  }

  pruneExpiredDungeonEnemyMovementTransitions(scene, state, animationMs);

  Object.values(state.enemies).forEach((enemy) => {
    const targetCoord = enemy.dungeonMovementTargetCoord;
    if (
      !targetCoord ||
      enemy.dungeonMovementCooldownEndsAt === undefined ||
      scene.dungeonEnemyMovementTransitionsByEnemyId.has(enemy.id)
    ) {
      return;
    }

    scene.dungeonEnemyMovementTransitionsByEnemyId.set(enemy.id, {
      durationMs: WORLD_MOVE_VISUAL_DURATION_MS,
      fromCoord: { ...enemy.coord },
      startedAtMs: animationMs,
      toCoord: { ...targetCoord },
    });
  });
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
  const targetCoord = enemy.dungeonMovementTargetCoord;
  const transition = scene.dungeonEnemyMovementTransitionsByEnemyId.get(
    enemy.id,
  );
  if (
    !targetCoord ||
    !transition ||
    !sameCoord(transition.fromCoord, enemy.coord) ||
    !sameCoord(transition.toCoord, targetCoord)
  ) {
    return undefined;
  }

  const offsetAtStart = tileToPoint(
    {
      q: enemy.coord.q - targetCoord.q,
      r: enemy.coord.r - targetCoord.r,
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
  scene.dungeonEnemyMovementTransitionsByEnemyId.clear();
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
        enemy.dungeonMovementTargetCoord === undefined ||
        !sameCoord(enemy.coord, transition.fromCoord) ||
        !sameCoord(enemy.dungeonMovementTargetCoord, transition.toCoord) ||
        animationMs < transition.startedAtMs
      ) {
        scene.dungeonEnemyMovementTransitionsByEnemyId.delete(enemyId);
      }
    },
  );
}

function sameCoord(left: HexCoord, right: HexCoord) {
  return left.q === right.q && left.r === right.r;
}
