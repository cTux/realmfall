import type { HexCoord, WorldKind } from '../../game/stateTypes';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import { tileToPoint } from './renderSceneMath';
import { takeGraphics, type GraphicsPool } from './renderScenePools';
import type { SceneCache } from './renderSceneCache';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../game/config';
import {
  getVisibleTileRevealState,
  type MovementTransitionRevealState,
} from './renderSceneVisibility';

const PLAYER_BAR_TRACK_COLOR = 0x422006;
const PLAYER_BAR_TRACK_ALPHA = 0.85;
const PLAYER_RESOURCE_TRACK_ALPHA = 0.4;
const PLAYER_BAR_FILL_ALPHA = 0.95;
const PLAYER_HEALTH_BAR_COLOR = 0xdc2626;
const PLAYER_MANA_BAR_COLOR = 0x38bdf8;
const MOVEMENT_COOLDOWN_BAR_COLOR = 0xfacc15;

export function renderPlayerMovementCooldown({
  scene,
  hexSize,
  origin,
  playerIconSize,
  movementCooldown,
}: {
  scene: SceneCache;
  hexSize: number;
  origin: { x: number; y: number };
  playerIconSize: number;
  movementCooldown: {
    durationMs: number;
    endAtMs: number;
    nowMs: number;
  } | null;
}) {
  if (!movementCooldown) {
    return;
  }

  const remainingMs = Math.max(
    0,
    movementCooldown.endAtMs - movementCooldown.nowMs,
  );
  if (remainingMs <= 0) {
    return;
  }

  const progress = Math.min(1, remainingMs / movementCooldown.durationMs);
  const thickness = Math.max(3, playerIconSize * 0.075);

  renderPlayerEdgeBar({
    fillAlpha: PLAYER_BAR_FILL_ALPHA,
    color: MOVEMENT_COOLDOWN_BAR_COLOR,
    endAngle: Math.PI / 2,
    hexSize,
    origin,
    progress,
    startAngle: Math.PI / 6,
    thickness,
    trackAlpha: PLAYER_BAR_TRACK_ALPHA,
    trackColor: PLAYER_BAR_TRACK_COLOR,
    trackPool: scene.playerCooldownGraphics,
  });
}

export function renderDungeonEnemyMovementCooldowns({
  scene,
  hexSize,
  movementTransitionRevealState,
  origin,
  playerCoord,
  visibleTileRenderInputs,
  worldKind,
  worldTimeMs,
}: {
  scene: SceneCache;
  hexSize: number;
  origin: { x: number; y: number };
  movementTransitionRevealState: MovementTransitionRevealState | null;
  playerCoord: HexCoord;
  visibleTileRenderInputs: VisibleTileRenderInput[];
  worldKind: WorldKind;
  worldTimeMs: number;
}) {
  if (worldKind !== 'dungeon') {
    return;
  }

  for (const { enemies, tile } of visibleTileRenderInputs) {
    const revealState = getVisibleTileRevealState({
      movementTransitionState: movementTransitionRevealState,
      playerCoord,
      tile,
    });
    if (!revealState.revealed || !revealState.resolved) {
      continue;
    }

    const point = tileToPoint(
      {
        q: tile.coord.q - playerCoord.q,
        r: tile.coord.r - playerCoord.r,
      },
      origin.x,
      origin.y,
      hexSize,
    );

    for (const enemy of enemies) {
      if (
        enemy.dungeonMovementCooldownEndsAt === undefined ||
        enemy.dungeonMovementCooldownEndsAt <= worldTimeMs
      ) {
        continue;
      }

      const remainingMs = enemy.dungeonMovementCooldownEndsAt - worldTimeMs;
      const progress = Math.min(1, remainingMs / WORLD_MOVE_HEX_COOLDOWN_MS);
      const thickness = Math.max(3, hexSize * 0.11);

      renderPlayerEdgeBar({
        fillAlpha: PLAYER_BAR_FILL_ALPHA,
        color: MOVEMENT_COOLDOWN_BAR_COLOR,
        endAngle: -Math.PI / 6,
        hexSize,
        origin: point,
        progress,
        startAngle: -Math.PI / 2,
        thickness,
        trackAlpha: PLAYER_BAR_TRACK_ALPHA,
        trackColor: PLAYER_BAR_TRACK_COLOR,
        trackPool: scene.worldAnimatedMarkerBadgeGraphics,
      });
    }
  }
}

export function renderPlayerResourceBars({
  hexSize,
  origin,
  playerCombatStats,
  playerIconSize,
  scene,
}: {
  hexSize: number;
  origin: { x: number; y: number };
  playerCombatStats: {
    hp: number;
    mana: number;
    maxHp: number;
    maxMana: number;
  };
  playerIconSize: number;
  scene: SceneCache;
}) {
  const thickness = Math.max(3, playerIconSize * 0.075);

  renderPlayerEdgeBar({
    fillAlpha: PLAYER_BAR_FILL_ALPHA,
    color: PLAYER_HEALTH_BAR_COLOR,
    endAngle: (3 * Math.PI) / 2,
    hexSize,
    origin,
    progress: getResourceProgress(
      playerCombatStats.hp,
      playerCombatStats.maxHp,
    ),
    startAngle: (7 * Math.PI) / 6,
    thickness,
    trackAlpha: PLAYER_RESOURCE_TRACK_ALPHA,
    trackColor: PLAYER_HEALTH_BAR_COLOR,
    trackPool: scene.playerResourceGraphics,
  });
  renderPlayerEdgeBar({
    fillAlpha: PLAYER_BAR_FILL_ALPHA,
    color: PLAYER_MANA_BAR_COLOR,
    endAngle: (11 * Math.PI) / 6,
    hexSize,
    origin,
    progress: getResourceProgress(
      playerCombatStats.mana,
      playerCombatStats.maxMana,
    ),
    startAngle: (3 * Math.PI) / 2,
    thickness,
    trackAlpha: PLAYER_RESOURCE_TRACK_ALPHA,
    trackColor: PLAYER_MANA_BAR_COLOR,
    trackPool: scene.playerResourceGraphics,
  });
}

function renderPlayerEdgeBar({
  color,
  endAngle,
  fillAlpha,
  hexSize,
  origin,
  progress,
  startAngle,
  thickness,
  trackAlpha,
  trackColor,
  trackPool,
}: {
  color: number;
  endAngle: number;
  fillAlpha: number;
  hexSize: number;
  origin: { x: number; y: number };
  progress: number;
  startAngle: number;
  thickness: number;
  trackAlpha: number;
  trackColor: number;
  trackPool: GraphicsPool;
}) {
  const start = {
    x: origin.x + Math.cos(startAngle) * hexSize,
    y: origin.y + Math.sin(startAngle) * hexSize,
  };
  const end = {
    x: origin.x + Math.cos(endAngle) * hexSize,
    y: origin.y + Math.sin(endAngle) * hexSize,
  };
  const inwardNormal = getInwardNormal(start, end);

  takeGraphics(trackPool)
    .poly(buildPlayerBarQuad(start, end, inwardNormal, thickness))
    .fill({ color: trackColor, alpha: trackAlpha });

  if (progress <= 0) {
    return;
  }

  const fillEnd = {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };

  takeGraphics(trackPool)
    .poly(buildPlayerBarQuad(start, fillEnd, inwardNormal, thickness))
    .fill({ color, alpha: fillAlpha });
}

function getInwardNormal(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const edgeVector = {
    x: end.x - start.x,
    y: end.y - start.y,
  };
  const edgeLength = Math.hypot(edgeVector.x, edgeVector.y) || 1;
  const edgeDirection = {
    x: edgeVector.x / edgeLength,
    y: edgeVector.y / edgeLength,
  };

  return {
    x: -edgeDirection.y,
    y: edgeDirection.x,
  };
}

function getResourceProgress(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, value / max));
}

function buildPlayerBarQuad(
  start: { x: number; y: number },
  end: { x: number; y: number },
  inwardNormal: { x: number; y: number },
  thickness: number,
) {
  return [
    start.x,
    start.y,
    end.x,
    end.y,
    end.x + inwardNormal.x * thickness,
    end.y + inwardNormal.y * thickness,
    start.x + inwardNormal.x * thickness,
    start.y + inwardNormal.y * thickness,
  ];
}
