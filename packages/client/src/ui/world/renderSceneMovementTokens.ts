import type { HexCoord } from '@realmfall/core/game/stateTypes';
import { getSceneRenderTokens } from './renderSceneTokens';
import type { VisibleWorldTile } from './visibleWorldTiles';

export interface RenderSceneMovementCooldown {
  durationMs: number;
  endAtMs: number;
  nowMs: number;
}

export interface RenderSceneMovementTransition {
  displayTiles?: VisibleWorldTile[];
  durationMs: number;
  fromCoord: HexCoord;
  incomingTiles: VisibleWorldTile[];
  nowMs: number;
  outgoingTiles: VisibleWorldTile[];
  playerOffsetAtStart?: {
    x: number;
    y: number;
  };
  startedAtMs: number;
  toCoord: HexCoord;
}

type PlayerResourceTokenState = {
  hp: number;
  level: number;
  mana: number;
  maxHp: number;
  maxMana: number;
};

export function getMovementCooldownRenderToken(
  movementCooldown: RenderSceneMovementCooldown | null,
  worldRenderFrameMs: number,
) {
  if (!movementCooldown) {
    return -1;
  }

  return Math.max(
    0,
    Math.ceil(
      (movementCooldown.endAtMs - movementCooldown.nowMs) / worldRenderFrameMs,
    ),
  );
}

export function getMovementTransitionRenderToken(
  movementTransition: RenderSceneMovementTransition | null,
  worldRenderFrameMs: number,
) {
  if (!movementTransition) {
    return -1;
  }

  return Math.max(
    -1,
    Math.ceil(
      (movementTransition.startedAtMs +
        movementTransition.durationMs -
        movementTransition.nowMs) /
        worldRenderFrameMs,
    ),
  );
}

export function getMovementTransitionOffset(
  movementTransition: RenderSceneMovementTransition | null,
  hexSize: number,
) {
  if (!movementTransition) {
    return { x: 0, y: 0 };
  }

  const progress = getMovementTransitionProgress(movementTransition);
  if (progress === null) {
    return { x: 0, y: 0 };
  }

  const remainingProgress = 1 - progress;
  return getWorldHexSizeOffset({
    hexSize,
    q:
      (movementTransition.toCoord.q - movementTransition.fromCoord.q) *
      remainingProgress,
    r:
      (movementTransition.toCoord.r - movementTransition.fromCoord.r) *
      remainingProgress,
  });
}

export function getMovementTransitionPlayerOffset(
  movementTransition: RenderSceneMovementTransition | null,
) {
  if (!movementTransition?.playerOffsetAtStart) {
    return { x: 0, y: 0 };
  }

  const progress = getMovementTransitionProgress(movementTransition);
  if (progress === null) {
    return { x: 0, y: 0 };
  }

  const remainingProgress = 1 - progress;
  return {
    x: movementTransition.playerOffsetAtStart.x * remainingProgress,
    y: movementTransition.playerOffsetAtStart.y * remainingProgress,
  };
}

export function getWorldHexSizeOffset({
  hexSize,
  q,
  r,
}: {
  hexSize: number;
  q: number;
  r: number;
}) {
  return {
    x: hexSize * Math.sqrt(3) * (q + r / 2),
    y: hexSize * 1.5 * r,
  };
}

export function getPlayerResourceRenderToken({
  hp,
  level,
  mana,
  maxHp,
  maxMana,
}: PlayerResourceTokenState) {
  return [level, hp, maxHp, mana, maxMana].join(':');
}

export function getVisibleEnemyBadgeRenderToken(
  engagedEnemyIds: string[] | undefined,
  visibleTileRenderInputs: ReturnType<
    typeof getSceneRenderTokens
  >['visibleTileRenderInputs'],
) {
  if (!engagedEnemyIds?.length) {
    return -1;
  }

  const engagedEnemyIdSet = new Set(engagedEnemyIds);
  let token = 2166136261;
  let hasVisibleEngagedEnemy = false;

  visibleTileRenderInputs.forEach(({ hostileEnemies, tile }) => {
    const engagedHostiles = hostileEnemies.filter((enemy) =>
      engagedEnemyIdSet.has(enemy.id),
    );
    if (engagedHostiles.length === 0) {
      return;
    }

    hasVisibleEngagedEnemy = true;
    token = mixRenderToken(token, coordToken(tile.coord));

    engagedHostiles.forEach((enemy) => {
      token = mixRenderToken(token, hashRenderString(enemy.id));
      token = mixRenderToken(token, enemy.hp);
      token = mixRenderToken(token, enemy.maxHp);
      token = mixRenderToken(token, enemy.mana ?? 0);
      token = mixRenderToken(token, enemy.maxMana ?? 0);
    });
  });

  return hasVisibleEngagedEnemy ? token : -1;
}

export function mixRenderToken(token: number, value: number) {
  return Math.imul(token ^ value, 16777619) >>> 0;
}

function getMovementTransitionProgress(
  movementTransition: RenderSceneMovementTransition,
) {
  const endAtMs =
    movementTransition.startedAtMs + movementTransition.durationMs;
  if (movementTransition.nowMs >= endAtMs) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      1,
      (movementTransition.nowMs - movementTransition.startedAtMs) /
        movementTransition.durationMs,
    ),
  );
}

function hashRenderString(value: string) {
  let token = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    token = mixRenderToken(token, value.charCodeAt(index));
  }

  return token;
}

function coordToken(coord: HexCoord) {
  let token = 2166136261;
  token = mixRenderToken(token, coord.q + 2048);
  token = mixRenderToken(token, coord.r + 2048);
  return token;
}
