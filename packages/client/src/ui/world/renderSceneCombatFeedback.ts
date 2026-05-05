import { TextStyle } from 'pixi.js';
import { getAppliedInterfaceFontStack } from '../../app/interfaceFonts';
import { hexKey } from '../../game/hex';
import type { WorldFloatingTextEvent } from '../../game/types';
import type { GameState, HexCoord } from '../../game/stateTypes';
import { tileToPoint } from './renderSceneMath';
import {
  getHostileEnemyBadgeOuterRadius,
  getPlayerBadgeOuterRadius,
} from './renderScenePlayerBars';
import { setTextPosition, setTextScale, takeText } from './renderScenePools';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import type { SceneCache } from './renderSceneCache';

const WORLD_FLOATING_TEXT_LIFETIME_MS = 1_200;
const PLAYER_LUNGE_DURATION_MS = 180;
const PLAYER_LUNGE_DISTANCE_RATIO = 0.16;
const PLAYER_LUNGE_MIN_PX = 8;
const FLOATING_TEXT_RISE_PX = 18;
const FLOATING_TEXT_BASE_OFFSET_PX = 12;
const DAMAGE_COLOR = 0xff2d55;
const CRITICAL_DAMAGE_COLOR = 0xf97316;
const HEALING_COLOR = 0x4ade80;
const NORMAL_TEXT_SCALE = 0.95;
const CRITICAL_TEXT_SCALE = 1.1;
const HEALING_TEXT_SCALE = 0.98;
const textStylesByKey = new Map<string, TextStyle>();

export function getCombatFeedbackRenderToken({
  state,
  worldRenderFrameMs,
  worldTimeMs,
}: {
  state: GameState;
  worldRenderFrameMs: number;
  worldTimeMs: number;
}) {
  let token = 2166136261;
  let hasFeedback = false;

  const lunge = getCombatLungeDescriptor(state, worldTimeMs);
  if (lunge) {
    hasFeedback = true;
    token = mixToken(token, coordToken(lunge.stagingCoord));
    token = mixToken(token, coordToken(lunge.targetCoord));
    token = mixToken(token, lunge.startedAtMs ?? 0);
    if (lunge.animating) {
      token = mixToken(
        token,
        Math.floor(
          (worldTimeMs - (lunge.startedAtMs ?? worldTimeMs)) /
            worldRenderFrameMs,
        ) + 1,
      );
    }
  }

  for (const event of state.worldFloatingTextEvents) {
    const ageMs = worldTimeMs - event.createdAtMs;
    if (ageMs < 0 || ageMs > WORLD_FLOATING_TEXT_LIFETIME_MS) {
      continue;
    }

    hasFeedback = true;
    token = mixToken(token, hashString(event.id));
    token = mixToken(token, event.amount);
    token = mixToken(token, hashString(event.kind));
    token = mixToken(token, event.anchor.kind === 'player' ? 1 : 2);
    if (event.anchor.kind === 'enemy') {
      token = mixToken(token, hashString(event.anchor.enemyId));
      token = mixToken(token, coordToken(event.anchor.coord));
    }
    token = mixToken(token, Math.floor(ageMs / worldRenderFrameMs) + 1);
  }

  return hasFeedback ? token : -1;
}

export function getCombatLungeOffset({
  hexSize,
  state,
  worldTimeMs,
}: {
  hexSize: number;
  state: GameState;
  worldTimeMs: number;
}) {
  const descriptor = getCombatLungeDescriptor(state, worldTimeMs);
  if (!descriptor) {
    return { x: 0, y: 0 };
  }

  const targetDelta = tileToPoint(
    {
      q: descriptor.targetCoord.q - descriptor.stagingCoord.q,
      r: descriptor.targetCoord.r - descriptor.stagingCoord.r,
    },
    0,
    0,
    hexSize,
  );
  const distance = Math.hypot(targetDelta.x, targetDelta.y);
  if (distance <= 0) {
    return { x: 0, y: 0 };
  }

  const progress = getCombatLungeProgress(descriptor, worldTimeMs);
  if (progress <= 0) {
    return { x: 0, y: 0 };
  }

  const lungeDistance = Math.min(
    distance * PLAYER_LUNGE_DISTANCE_RATIO,
    Math.max(PLAYER_LUNGE_MIN_PX, hexSize * PLAYER_LUNGE_DISTANCE_RATIO),
  );

  return {
    x: (targetDelta.x / distance) * lungeDistance * progress,
    y: (targetDelta.y / distance) * lungeDistance * progress,
  };
}

export function renderSceneCombatFeedback({
  enemyIconSize,
  hexSize,
  origin,
  playerCoord,
  playerIconSize,
  playerLungeOffset,
  scene,
  state,
  visibleTileRenderInputs,
  worldTimeMs,
}: {
  enemyIconSize: number;
  hexSize: number;
  origin: { x: number; y: number };
  playerCoord: HexCoord;
  playerIconSize: number;
  playerLungeOffset: { x: number; y: number };
  scene: SceneCache;
  state: GameState;
  visibleTileRenderInputs: VisibleTileRenderInput[];
  worldTimeMs: number;
}) {
  const enemyBadgeOuterRadius = getHostileEnemyBadgeOuterRadius(enemyIconSize);
  const playerBadgeOuterRadius = getPlayerBadgeOuterRadius(playerIconSize);
  const anchorByEnemyId = new Map<
    string,
    { point: { x: number; y: number }; radius: number }
  >();
  const tilePointByCoordKey = new Map<string, { x: number; y: number }>();

  for (const { hostileEnemies, tile } of visibleTileRenderInputs) {
    const point = tileToPoint(
      {
        q: tile.coord.q - playerCoord.q,
        r: tile.coord.r - playerCoord.r,
      },
      origin.x,
      origin.y,
      hexSize,
    );
    tilePointByCoordKey.set(hexKey(tile.coord), point);

    if (hostileEnemies.length === 0 || tile.structure === 'dungeon') {
      continue;
    }

    const markerPoint = {
      x: point.x,
      y: point.y - 2,
    };
    hostileEnemies.forEach((enemy) => {
      anchorByEnemyId.set(enemy.id, {
        point: markerPoint,
        radius: enemyBadgeOuterRadius,
      });
    });
  }

  const playerAnchor = {
    point: {
      x: origin.x + playerLungeOffset.x,
      y: origin.y + playerLungeOffset.y,
    },
    radius: playerBadgeOuterRadius,
  };

  for (const event of state.worldFloatingTextEvents) {
    const ageMs = worldTimeMs - event.createdAtMs;
    if (ageMs < 0 || ageMs > WORLD_FLOATING_TEXT_LIFETIME_MS) {
      continue;
    }

    const resolvedAnchor = resolveFloatingTextAnchor({
      anchorByEnemyId,
      enemyBadgeOuterRadius,
      event,
      hexSize,
      playerAnchor,
      tilePointByCoordKey,
    });
    if (!resolvedAnchor) {
      continue;
    }

    const lifetimeProgress = ageMs / WORLD_FLOATING_TEXT_LIFETIME_MS;
    const alpha = Math.max(0, 1 - lifetimeProgress);
    const text = takeText(scene.labelTexts, getFloatingTextStyle(event.kind));

    text.anchor.set(0.5);
    text.text = formatFloatingText(event);
    text.alpha = alpha;
    setTextScale(text, getFloatingTextScale(event.kind));
    setTextPosition(
      text,
      resolvedAnchor.point.x,
      resolvedAnchor.point.y -
        resolvedAnchor.radius -
        FLOATING_TEXT_BASE_OFFSET_PX -
        lifetimeProgress * FLOATING_TEXT_RISE_PX,
    );
  }
}

function resolveFloatingTextAnchor({
  anchorByEnemyId,
  enemyBadgeOuterRadius,
  event,
  hexSize,
  playerAnchor,
  tilePointByCoordKey,
}: {
  anchorByEnemyId: Map<
    string,
    { point: { x: number; y: number }; radius: number }
  >;
  enemyBadgeOuterRadius: number;
  event: WorldFloatingTextEvent;
  hexSize: number;
  playerAnchor: { point: { x: number; y: number }; radius: number };
  tilePointByCoordKey: Map<string, { x: number; y: number }>;
}) {
  if (event.anchor.kind === 'player') {
    return playerAnchor;
  }

  const visibleEnemyAnchor = anchorByEnemyId.get(event.anchor.enemyId);
  if (visibleEnemyAnchor) {
    return visibleEnemyAnchor;
  }

  const tilePoint = tilePointByCoordKey.get(hexKey(event.anchor.coord));
  if (!tilePoint) {
    return null;
  }

  return {
    point: tilePoint,
    radius: Math.max(enemyBadgeOuterRadius, hexSize * 0.38),
  };
}

function getFloatingTextStyle(kind: WorldFloatingTextEvent['kind']) {
  const fontFamily = getAppliedInterfaceFontStack();
  const fill =
    kind === 'critical-damage'
      ? CRITICAL_DAMAGE_COLOR
      : kind === 'healing'
        ? HEALING_COLOR
        : DAMAGE_COLOR;
  const cacheKey = `${fontFamily}:${fill}`;
  const cached = textStylesByKey.get(cacheKey);
  if (cached) {
    return cached;
  }

  const style = new TextStyle({
    fill,
    fontFamily,
    fontSize: 20,
    fontWeight: '900',
    stroke: {
      color: 0x020617,
      join: 'round',
      width: 3,
    },
  });
  textStylesByKey.set(cacheKey, style);
  return style;
}

function formatFloatingText(event: WorldFloatingTextEvent) {
  return event.kind === 'critical-damage'
    ? `${event.amount}!`
    : `${event.amount}`;
}

function getFloatingTextScale(kind: WorldFloatingTextEvent['kind']) {
  return kind === 'critical-damage'
    ? CRITICAL_TEXT_SCALE
    : kind === 'healing'
      ? HEALING_TEXT_SCALE
      : NORMAL_TEXT_SCALE;
}

function getCombatLungeDescriptor(state: GameState, worldTimeMs: number) {
  const targetCoord = state.combat?.engagement?.targetCoord;
  const stagingCoord = state.combat?.engagement?.stagingCoord;
  if (
    !state.combat?.started ||
    !targetCoord ||
    !stagingCoord ||
    sameCoord(targetCoord, stagingCoord)
  ) {
    return null;
  }

  return {
    animating:
      state.combat.startedAtMs != null &&
      worldTimeMs < state.combat.startedAtMs + PLAYER_LUNGE_DURATION_MS,
    startedAtMs: state.combat.startedAtMs,
    stagingCoord,
    targetCoord,
  };
}

function getCombatLungeProgress(
  descriptor: NonNullable<ReturnType<typeof getCombatLungeDescriptor>>,
  worldTimeMs: number,
) {
  if (descriptor.startedAtMs == null) {
    return 1;
  }

  const rawProgress = Math.max(
    0,
    Math.min(
      1,
      (worldTimeMs - descriptor.startedAtMs) / PLAYER_LUNGE_DURATION_MS,
    ),
  );
  return 1 - Math.pow(1 - rawProgress, 2);
}

function sameCoord(left: HexCoord, right: HexCoord) {
  return left.q === right.q && left.r === right.r;
}

function coordToken(coord: HexCoord) {
  let token = 2166136261;
  token = mixToken(token, coord.q + 2048);
  token = mixToken(token, coord.r + 2048);
  return token;
}

function hashString(value: string) {
  let token = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    token = mixToken(token, value.charCodeAt(index));
  }
  return token;
}

function mixToken(token: number, value: number) {
  return Math.imul(token ^ value, 16777619) >>> 0;
}
