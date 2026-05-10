import { WORLD_MOVE_HEX_COOLDOWN_MS } from '@realmfall/core/game/config';
import type { HexCoord, WorldKind } from '@realmfall/core/game/stateTypes';
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
import {
  resetShadowedSpriteBadgeOverlay,
  type ShadowedSpriteEntry,
} from './renderScenePools';
import { COMBAT_WORLD_ICON_TINT, WorldIcons } from './worldIcons';
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
export const PLAYER_BADGE_BACKGROUND_ALPHA = 0.6;
const HOSTILE_BADGE_OUTER_RADIUS_SCALE = 0.76;

export function renderPlayerMovementCooldown({
  scene,
  playerIconSize,
  movementCooldown,
}: {
  scene: SceneCache;
  playerIconSize: number;
  movementCooldown: {
    durationMs: number;
    endAtMs: number;
    nowMs: number;
  } | null;
}) {
  resetShadowedSpriteBadgeOverlay(scene.player);
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
    entry: scene.player,
    progress: Math.min(1, remainingMs / movementCooldown.durationMs),
  });
}

export function renderDungeonEnemyMovementCooldowns({
  scene,
  enemyIconSize,
  movementTransitionRevealState,
  playerCoord,
  revealRadius,
  visibleTileRenderInputs,
  worldKind,
  worldTimeMs,
}: {
  scene: SceneCache;
  enemyIconSize: number;
  movementTransitionRevealState: MovementTransitionRevealState | null;
  playerCoord: HexCoord;
  revealRadius: number;
  visibleTileRenderInputs: VisibleTileRenderInput[];
  worldKind: WorldKind;
  worldTimeMs: number;
}) {
  scene.animatedWorldMarkers.forEach((marker) => {
    if (marker.kind === 'enemy') {
      resetShadowedSpriteBadgeOverlay(marker.entry);
    }
  });
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
      revealRadius,
      tile,
    });
    if (revealState.visualRevealAlpha <= 0 || !revealState.resolved) {
      continue;
    }

    const leadEnemy = enemies[0];
    if (!leadEnemy) {
      continue;
    }
    if (
      leadEnemy.dungeonMovementCooldownEndsAt === undefined ||
      leadEnemy.dungeonMovementCooldownEndsAt <= worldTimeMs
    ) {
      continue;
    }

    const marker = scene.animatedWorldMarkers.find(
      (candidate) =>
        candidate.kind === 'enemy' && candidate.enemyId === leadEnemy.id,
    );
    if (!marker) {
      continue;
    }

    renderMovementCooldownArc({
      alpha: revealState.visualRevealAlpha,
      cooldownBand,
      entry: marker.entry,
      progress: Math.min(
        1,
        (leadEnemy.dungeonMovementCooldownEndsAt - worldTimeMs) /
          WORLD_MOVE_HEX_COOLDOWN_MS,
      ),
    });
  }
}

export function renderPlayerResourceBars({
  playerIsBattleEntity,
  playerCombatStats,
  playerIconSize,
  playerLevel,
  scene,
}: {
  playerIsBattleEntity: boolean;
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
    battleIndicator: playerIsBattleEntity
      ? {
          icon: WorldIcons.Combat,
          tint: COMBAT_WORLD_ICON_TINT,
        }
      : undefined,
    backgroundAlpha: PLAYER_BADGE_BACKGROUND_ALPHA,
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
  return expandEntityBadgeArcBand(getEntityBadgeArcBand(badgeOuterRadius), 0);
}

function renderMovementCooldownArc({
  alpha = 1,
  cooldownBand,
  entry,
  progress,
}: {
  alpha?: number;
  cooldownBand: ReturnType<typeof getMovementCooldownArcBand>;
  entry: ShadowedSpriteEntry;
  progress: number;
}) {
  const trackGraphic = entry.badgeOverlayGraphics;
  trackGraphic.clear();
  trackGraphic.visible = true;
  drawEntityBadgeArc(trackGraphic, {
    alpha: PLAYER_BAR_TRACK_ALPHA * alpha,
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

  drawEntityBadgeArc(trackGraphic, {
    alpha: PLAYER_BAR_FILL_ALPHA * alpha,
    color: MOVEMENT_COOLDOWN_BAR_COLOR,
    endAngle: ENTITY_BADGE_MP_ARC_ANGLES.endAngle,
    innerRadius: cooldownBand.innerRadius,
    outerRadius: cooldownBand.outerRadius,
    progress,
    startAngle: ENTITY_BADGE_MP_ARC_ANGLES.startAngle,
  });
}
