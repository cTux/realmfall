import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../../game/config';
import { startCombat } from '../../../game/stateCombat';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import { WORLD_COMBAT_LUNGE_DURATION_MS } from '../../../game/worldCombatPresentation';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
import { getWorldCombatLungeOffset } from '../../../ui/world/worldCombatLunge';
import { sameCoord } from '../usePixiWorldHover';
import type { WorldMovementTransition } from './movement/worldMovementTransition';

export interface PendingCombatUpdatePlan {
  action: 'none' | 'stamp' | 'start';
  delayMs: number;
}

export interface PendingVictoryTransitionOffset {
  fromCoord: HexCoord;
  offset: { x: number; y: number };
  toCoord: HexCoord;
}

export interface PostCombatAutoStepTransition {
  cooldownEndAtMs: number;
  pendingVictoryTransitionOffset: PendingVictoryTransitionOffset | null;
}

export function getPendingCombatUpdatePlan({
  combat,
  movementNowMs,
  movementTransition,
  playerCoord,
  worldTimeMs,
}: {
  combat: NonNullable<GameState['combat']>;
  movementNowMs: number;
  movementTransition: WorldMovementTransition | null;
  playerCoord: HexCoord;
  worldTimeMs: number;
}): PendingCombatUpdatePlan {
  if (combat.started) {
    return { action: 'none', delayMs: 0 };
  }

  if (combat.startedAtMs == null) {
    const remainingApproachMs = getPendingCombatApproachDelayMs({
      combat,
      movementTransition,
      nowMs: movementNowMs,
      playerCoord,
    });
    if (remainingApproachMs > 0) {
      return { action: 'stamp', delayMs: remainingApproachMs };
    }

    return {
      action: hasPendingCombatLunge(combat) ? 'stamp' : 'start',
      delayMs: 0,
    };
  }

  const remainingIntroMs = hasPendingCombatLunge(combat)
    ? Math.max(
        0,
        WORLD_COMBAT_LUNGE_DURATION_MS -
          Math.max(0, worldTimeMs - combat.startedAtMs),
      )
    : 0;

  return {
    action: 'start',
    delayMs: remainingIntroMs,
  };
}

export function getPendingCombatApproachDelayMs({
  combat,
  movementTransition,
  nowMs,
  playerCoord,
}: {
  combat: NonNullable<GameState['combat']>;
  movementTransition: WorldMovementTransition | null;
  nowMs: number;
  playerCoord: HexCoord;
}) {
  if (!hasPendingCombatLunge(combat)) {
    return 0;
  }

  if (
    !movementTransition ||
    !sameCoord(movementTransition.toCoord, playerCoord)
  ) {
    return 0;
  }

  return Math.max(
    0,
    movementTransition.startedAtMs + movementTransition.durationMs - nowMs,
  );
}

export function hasPendingCombatLunge(
  combat: NonNullable<GameState['combat']>,
) {
  const targetCoord = combat.engagement?.targetCoord;
  const stagingCoord = combat.engagement?.stagingCoord;
  return Boolean(
    targetCoord && stagingCoord && !sameCoord(targetCoord, stagingCoord),
  );
}

export function stampPendingCombatIntro({
  current,
  gameRef,
  worldTimeMs,
}: {
  current: GameState;
  gameRef: MutableRefObject<GameState>;
  worldTimeMs: number;
}) {
  if (
    !current.combat ||
    current.combat.started ||
    current.combat.startedAtMs != null
  ) {
    return current;
  }

  const next = {
    ...current,
    combat: {
      ...current.combat,
      startedAtMs: worldTimeMs,
    },
  };
  gameRef.current = next;
  return next;
}

export function autoStartPendingCombat({
  current,
  gameRef,
  worldTimeMs,
}: {
  current: GameState;
  gameRef: MutableRefObject<GameState>;
  worldTimeMs: number;
}) {
  if (!current.combat || current.combat.started) {
    return current;
  }

  const next = startCombat({
    ...current,
    worldTimeMs,
  });
  gameRef.current = next;
  return next;
}

export function getPostCombatAutoStepTransition({
  app,
  game,
  nowMs,
  previousGame,
}: {
  app: Application | null;
  game: GameState;
  nowMs: number;
  previousGame: GameState;
}): PostCombatAutoStepTransition | null {
  const previousEngagement = previousGame.combat?.engagement;
  if (
    !previousEngagement?.autoStepOnVictory ||
    previousEngagement.targetCoord === null ||
    game.combat !== null ||
    !sameCoord(game.player.coord, previousEngagement.targetCoord) ||
    sameCoord(previousGame.player.coord, previousEngagement.targetCoord)
  ) {
    return null;
  }

  const carriedOffset = getPostCombatTransitionOffset({
    app,
    previousGame,
  });

  return {
    cooldownEndAtMs: nowMs + WORLD_MOVE_HEX_COOLDOWN_MS,
    pendingVictoryTransitionOffset: carriedOffset
      ? {
          fromCoord: previousGame.player.coord,
          offset: carriedOffset,
          toCoord: previousEngagement.targetCoord,
        }
      : null,
  };
}

export function getPostCombatTransitionOffset({
  app,
  previousGame,
}: {
  app: Application | null;
  previousGame: GameState;
}) {
  const combat = previousGame.combat;
  const engagement = combat?.engagement;
  if (
    !app ||
    combat === null ||
    combat.startedAtMs == null ||
    !engagement?.stagingCoord ||
    !engagement.targetCoord
  ) {
    return null;
  }

  const hexSize = getWorldHexSize(app.screen, previousGame.radius);
  const offset = getWorldCombatLungeOffset({
    hexSize,
    phase: combat.started ? 'held' : 'animating',
    stagingCoord: engagement.stagingCoord,
    startedAtMs: combat.startedAtMs,
    targetCoord: engagement.targetCoord,
    worldTimeMs: previousGame.worldTimeMs,
  });

  return Math.hypot(offset.x, offset.y) > 0 ? offset : null;
}
