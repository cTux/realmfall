import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../game/config';
import type { HexCoord, WorldKind } from '../../game/stateTypes';
import type { SceneCache } from './renderSceneCache';
import {
  decorateEntityBadge,
  ENTITY_BADGE_BACKGROUND_COLORS,
  ENTITY_BADGE_MP_ARC_ANGLES,
  ENTITY_BADGE_RADIUS_SCALE,
  drawEntityBadgeArc,
  expandEntityBadgeArcBand,
  getEntityBadgeArcBand,
} from './renderSceneEntityBadge';
import { tileToPoint } from './renderSceneMath';
import { takeGraphics, type GraphicsPool } from './renderScenePools';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import {
  getVisibleTileRevealState,
  type MovementTransitionRevealState,
} from './renderSceneVisibility';

const PLAYER_BAR_TRACK_COLOR = 0x422006;
const PLAYER_BAR_TRACK_ALPHA = 0.85;
const PLAYER_BAR_FILL_ALPHA = 0.95;
const MOVEMENT_COOLDOWN_BAR_COLOR = 0xfacc15;
const PLAYER_BADGE_OUTER_RADIUS_SCALE = 0.78;
const HOSTILE_BADGE_OUTER_RADIUS_SCALE = 0.76;
const COOLDOWN_ARC_GAP_PX = 3;

export function renderPlayerMovementCooldown({
  scene,
  origin,
  playerIconSize,
  movementCooldown,
}: {
  scene: SceneCache;
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

  renderMovementCooldownArc({
    cooldownBand: getMovementCooldownArcBand(
      getPlayerBadgeOuterRadius(playerIconSize),
    ),
    origin,
    progress: Math.min(1, remainingMs / movementCooldown.durationMs),
    trackPool: scene.playerCooldownGraphics,
  });
}

export function renderDungeonEnemyMovementCooldowns({
  scene,
  enemyIconSize,
  hexSize,
  movementTransitionRevealState,
  origin,
  playerCoord,
  visibleTileRenderInputs,
  worldKind,
  worldTimeMs,
}: {
  scene: SceneCache;
  enemyIconSize: number;
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

  const cooldownBand = getMovementCooldownArcBand(
    getHostileEnemyBadgeOuterRadius(enemyIconSize),
  );

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

      renderMovementCooldownArc({
        cooldownBand,
        origin: {
          x: point.x,
          y: point.y - 2,
        },
        progress: Math.min(
          1,
          (enemy.dungeonMovementCooldownEndsAt - worldTimeMs) /
            WORLD_MOVE_HEX_COOLDOWN_MS,
        ),
        trackPool: scene.worldAnimatedMarkerBadgeGraphics,
      });
    }
  }
}

export function renderPlayerResourceBars({
  playerCombatStats,
  playerIconSize,
  playerLevel,
  scene,
}: {
  playerCombatStats: {
    hp: number;
    mana: number;
    maxHp: number;
    maxMana: number;
  };
  playerIconSize: number;
  playerLevel: number;
  scene: SceneCache;
}) {
  decorateEntityBadge(scene.player, {
    alpha: 1,
    backgroundColor: ENTITY_BADGE_BACKGROUND_COLORS.player,
    hp: {
      current: playerCombatStats.hp,
      max: playerCombatStats.maxHp,
    },
    levelLabel: playerLevel.toString(),
    mana: {
      current: playerCombatStats.mana,
      max: playerCombatStats.maxMana,
    },
    outerRadius: getPlayerBadgeOuterRadius(playerIconSize),
  });
}

export function getPlayerBadgeOuterRadius(playerIconSize: number) {
  return (
    Math.max(18, playerIconSize * PLAYER_BADGE_OUTER_RADIUS_SCALE) *
    ENTITY_BADGE_RADIUS_SCALE
  );
}

export function getHostileEnemyBadgeOuterRadius(enemyIconSize: number) {
  return (
    enemyIconSize * HOSTILE_BADGE_OUTER_RADIUS_SCALE * ENTITY_BADGE_RADIUS_SCALE
  );
}

function getMovementCooldownArcBand(badgeOuterRadius: number) {
  return expandEntityBadgeArcBand(
    getEntityBadgeArcBand(badgeOuterRadius),
    COOLDOWN_ARC_GAP_PX,
  );
}

function renderMovementCooldownArc({
  cooldownBand,
  origin,
  progress,
  trackPool,
}: {
  cooldownBand: ReturnType<typeof getMovementCooldownArcBand>;
  origin: { x: number; y: number };
  progress: number;
  trackPool: GraphicsPool;
}) {
  const trackGraphic = takeGraphics(trackPool);
  trackGraphic.position.set(origin.x, origin.y);
  drawEntityBadgeArc(trackGraphic, {
    alpha: PLAYER_BAR_TRACK_ALPHA,
    color: PLAYER_BAR_TRACK_COLOR,
    endAngle: ENTITY_BADGE_MP_ARC_ANGLES.endAngle,
    innerRadius: cooldownBand.innerRadius,
    outerRadius: cooldownBand.outerRadius,
    progress: 1,
    startAngle: ENTITY_BADGE_MP_ARC_ANGLES.startAngle,
  });

  if (progress <= 0) {
    return;
  }

  const fillGraphic = takeGraphics(trackPool);
  fillGraphic.position.set(origin.x, origin.y);
  drawEntityBadgeArc(fillGraphic, {
    alpha: PLAYER_BAR_FILL_ALPHA,
    color: MOVEMENT_COOLDOWN_BAR_COLOR,
    endAngle: ENTITY_BADGE_MP_ARC_ANGLES.endAngle,
    innerRadius: cooldownBand.innerRadius,
    outerRadius: cooldownBand.outerRadius,
    progress,
    startAngle: ENTITY_BADGE_MP_ARC_ANGLES.startAngle,
  });
}
