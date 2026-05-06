import { TextStyle } from 'pixi.js';
import { getAppliedInterfaceFontStack } from '../../app/interfaceFonts';
import { hexKey } from '../../game/hex';
import type { WorldFloatingTextEvent } from '../../game/types';
import type { GameState, HexCoord } from '../../game/stateTypes';
import { isWorldBossEnemyId } from '../../game/worldBoss';
import { ENTITY_BADGE_RADIUS_SCALE } from './renderSceneEntityBadge';
import { tileToPoint } from './renderSceneMath';
import {
  getHostileEnemyBadgeOuterRadius,
  getPlayerBadgeOuterRadius,
} from './renderScenePlayerBars';
import { setTextPosition, setTextScale, takeText } from './renderScenePools';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import type { SceneCache } from './renderSceneCache';
import { ENEMY_GROUP_BADGE_OFFSET } from './renderSceneShared';
import { getWorldCombatLungeOffset } from './worldCombatLunge';

const WORLD_FLOATING_TEXT_LIFETIME_MS = 1_200;
const FLOATING_TEXT_RISE_PX = 18;
const FLOATING_TEXT_BASE_OFFSET_PX = 12;
const DAMAGE_COLOR = 0xff2d55;
const CRITICAL_DAMAGE_COLOR = 0xf97316;
const HEALING_COLOR = 0x4ade80;
const NORMAL_TEXT_SCALE = 0.95;
const CRITICAL_TEXT_SCALE = 1.1;
const HEALING_TEXT_SCALE = 0.98;
const DUNGEON_HOSTILE_GROUP_BADGE_RADIUS_RATIO = 0.4;
const WORLD_BOSS_BADGE_RADIUS_RATIO = 0.58;
const WORLD_BOSS_ICON_SIZE_RATIO = 3.4;
const textStylesByKey = new Map<string, TextStyle>();

interface FloatingTextAnchor {
  point: { x: number; y: number };
  radius: number;
}

interface HostileMarkerAnchorSet {
  boss: FloatingTextAnchor;
  enemy: FloatingTextAnchor;
}

interface CombatLungeDescriptor {
  phase: 'animating' | 'held';
  startedAtMs: number;
  stagingCoord: HexCoord;
  targetCoord: HexCoord;
}

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

  const lunge = getCombatLungeDescriptor(state);
  if (lunge) {
    hasFeedback = true;
    token = mixToken(token, coordToken(lunge.stagingCoord));
    token = mixToken(token, coordToken(lunge.targetCoord));
    token = mixToken(token, lunge.startedAtMs);
    if (lunge.phase === 'animating') {
      token = mixToken(
        token,
        Math.floor(
          (worldTimeMs - lunge.startedAtMs) / worldRenderFrameMs,
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
  const descriptor = getCombatLungeDescriptor(state);
  if (!descriptor) {
    return { x: 0, y: 0 };
  }

  return getWorldCombatLungeOffset({
    hexSize,
    phase: descriptor.phase,
    stagingCoord: descriptor.stagingCoord,
    startedAtMs: descriptor.startedAtMs,
    targetCoord: descriptor.targetCoord,
    worldTimeMs,
  });
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
  const worldBossBadgeOuterRadius =
    hexSize *
    WORLD_BOSS_ICON_SIZE_RATIO *
    WORLD_BOSS_BADGE_RADIUS_RATIO *
    ENTITY_BADGE_RADIUS_SCALE;
  const playerBadgeOuterRadius = getPlayerBadgeOuterRadius(playerIconSize);
  const anchorByEnemyId = new Map<string, FloatingTextAnchor>();
  const fallbackAnchorByCoordKey = new Map<string, HostileMarkerAnchorSet>();

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
    const anchorSet = createHostileMarkerAnchorSet(
      point,
      tile.structure,
      enemyBadgeOuterRadius,
      worldBossBadgeOuterRadius,
    );
    fallbackAnchorByCoordKey.set(hexKey(tile.coord), anchorSet);

    if (hostileEnemies.length === 0) {
      continue;
    }

    hostileEnemies.forEach((enemy) => {
      anchorByEnemyId.set(
        enemy.id,
        isWorldBossEnemyId(enemy.id) ? anchorSet.boss : anchorSet.enemy,
      );
    });
  }

  const playerAnchor: FloatingTextAnchor = {
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

    const isEnemyDefeated =
      event.anchor.kind === 'enemy' && !state.enemies[event.anchor.enemyId];
    const resolvedAnchor = resolveFloatingTextAnchor({
      anchorByEnemyId,
      fallbackAnchorByCoordKey,
      event,
      isEnemyDefeated,
      playerAnchor,
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
  fallbackAnchorByCoordKey,
  event,
  isEnemyDefeated,
  playerAnchor,
}: {
  anchorByEnemyId: Map<string, FloatingTextAnchor>;
  fallbackAnchorByCoordKey: Map<string, HostileMarkerAnchorSet>;
  event: WorldFloatingTextEvent;
  isEnemyDefeated: boolean;
  playerAnchor: FloatingTextAnchor;
}) {
  if (event.anchor.kind === 'player') {
    return playerAnchor;
  }

  const liveAnchor = anchorByEnemyId.get(event.anchor.enemyId);
  if (liveAnchor) {
    return liveAnchor;
  }

  if (!isEnemyDefeated) {
    return null;
  }

  const fallbackAnchor = fallbackAnchorByCoordKey.get(
    hexKey(event.anchor.coord),
  );
  if (!fallbackAnchor) {
    return null;
  }

  return isWorldBossEnemyId(event.anchor.enemyId)
    ? fallbackAnchor.boss
    : fallbackAnchor.enemy;
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

function getCombatLungeDescriptor(state: GameState): CombatLungeDescriptor | null {
  const targetCoord = state.combat?.engagement?.targetCoord;
  const stagingCoord = state.combat?.engagement?.stagingCoord;
  if (
    !state.combat ||
    !targetCoord ||
    !stagingCoord ||
    sameCoord(targetCoord, stagingCoord)
  ) {
    return null;
  }

  if (state.combat.startedAtMs == null) {
    return null;
  }

  return {
    phase: state.combat.started ? 'held' : 'animating',
    startedAtMs: state.combat.startedAtMs,
    stagingCoord,
    targetCoord,
  };
}

function createHostileMarkerAnchorSet(
  point: { x: number; y: number },
  structure: VisibleTileRenderInput['tile']['structure'],
  enemyBadgeOuterRadius: number,
  worldBossBadgeOuterRadius: number,
) {
  if (structure === 'dungeon') {
    const dungeonAnchor = {
      point: {
        x: point.x + ENEMY_GROUP_BADGE_OFFSET.x,
        y: point.y + ENEMY_GROUP_BADGE_OFFSET.y,
      },
      radius: Math.max(
        8,
        enemyBadgeOuterRadius * DUNGEON_HOSTILE_GROUP_BADGE_RADIUS_RATIO,
      ),
    };
    return {
      boss: dungeonAnchor,
      enemy: dungeonAnchor,
    };
  }

  return {
    boss: {
      point,
      radius: worldBossBadgeOuterRadius,
    },
    enemy: {
      point: {
        x: point.x,
        y: point.y - 2,
      },
      radius: enemyBadgeOuterRadius,
    },
  };
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
