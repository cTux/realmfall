import { type Application } from 'pixi.js';
import { getActiveWorld } from '../../game/dungeons/worldState';
import { hexKey } from '../../game/hex';
import { getPlayerCombatStats } from '../../game/stateSelectors';
import type { GameState, HexCoord, WorldKind } from '../../game/stateTypes';
import { recordPixiRenderCounts } from '../../performance/performanceHarness';
import {
  applyWorldSceneOffset,
  beginAnimatedSceneRender,
  beginInteractionSceneRender,
  beginStaticSceneRender,
  completeInteractionSceneRender,
  completeStaticSceneRender,
  getSceneCache,
} from './renderSceneCache';
import { getSceneRenderTokens } from './renderSceneTokens';
import {
  getLightingState,
  renderAtmosphere,
  renderSkyLayer,
} from './renderSceneAtmosphere';
import { getWorldHexSize } from './renderSceneMath';
import { getFullscreenVisualEffectsState } from './renderSceneFullscreenEffects';
import {
  updateWorldMapFishEyeFilter,
  WORLD_MAP_FISHEYE_ENABLED,
} from './worldMapFishEyeRuntime';
import {
  getAnimatedRenderToken,
  getCloudRenderInputs,
  WORLD_MAP_CLOUD_PARALLAX_FACTOR,
  ZERO_SHADOW_OFFSET,
} from './renderSceneShared';
import { getCombatFeedbackRenderToken } from './renderSceneCombatFeedback';
import { renderTilePasses } from './renderSceneTilePasses';
import { renderAnimatedScene } from './renderSceneAnimated';
import { syncDungeonEnemyMovementTransitions } from './renderSceneDungeonEnemyTransitions';
import { renderPlayerResourceBars } from './renderScenePlayerBars';
import { getMovementTransitionRevealState } from './renderSceneVisibility';
import {
  DEFAULT_WORLD_RENDER_FPS,
  getWorldRenderFrameMs,
} from './renderCadence';
import type { VisibleWorldTile } from './visibleWorldTiles';

interface RenderSceneOptions {
  cloudTransparency?: number;
  showTerrainBackgrounds?: boolean;
  showClouds?: boolean;
  queuedPath?: HexCoord[] | null;
  worldRenderFps?: number;
  worldTimeMs?: number;
  movementCooldown?: RenderSceneMovementCooldown | null;
  movementTransition?: RenderSceneMovementTransition | null;
}

interface RenderSceneMovementCooldown {
  durationMs: number;
  endAtMs: number;
  nowMs: number;
}

interface RenderSceneMovementTransition {
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

export function renderScene(
  app: Application,
  state: GameState,
  visibleTiles: VisibleWorldTile[],
  selected: HexCoord,
  hoveredMove: HexCoord | null,
  worldTimeMinutes = 12 * 60,
  animationMs = 0,
  hoveredSafePath: HexCoord[] | null = null,
  options: RenderSceneOptions = {},
) {
  const scene = getSceneCache(app);
  scene.renderCounts.total += 1;
  const currentWorld = getActiveWorld(state);
  const currentWorldKind: WorldKind = currentWorld?.kind ?? 'surface';
  const currentWorldId = currentWorld?.id ?? state.surfaceWorldId;
  const atmosphereSeed =
    currentWorldKind === 'dungeon'
      ? `${state.seed}:${currentWorldId}`
      : state.seed;
  const cloudInputs = getCloudRenderInputs(
    scene,
    atmosphereSeed,
    currentWorldKind,
  );
  const origin = {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
  };
  const hexSize = getWorldHexSize(app.screen, state.radius);
  const structureIconSize = hexSize * 1.065;
  const enemyIconSize = hexSize * 0.945;
  const worldBossIconSize = hexSize * 3.4;
  const playerIconSize = hexSize * 0.95;
  const terrainArtSize = hexSize * 2;
  const showClouds = options.showClouds ?? true;
  const cloudTransparency = normalizeRenderCloudTransparency(
    options.cloudTransparency,
  );
  const showTerrainBackgrounds = options.showTerrainBackgrounds ?? true;
  const worldRenderFrameMs = getWorldRenderFrameMs(
    options.worldRenderFps ?? DEFAULT_WORLD_RENDER_FPS,
  );
  const queuedPath = options.queuedPath ?? null;
  const renderWorldTimeMs = options.worldTimeMs ?? state.worldTimeMs;
  const movementCooldown = options.movementCooldown ?? null;
  const movementTransition = options.movementTransition ?? null;
  syncDungeonEnemyMovementTransitions(scene, state, animationMs);
  const movementTransitionRenderToken = getMovementTransitionRenderToken(
    movementTransition,
    worldRenderFrameMs,
  );
  const movementTransitionRevealState =
    getMovementTransitionRevealState(movementTransition);
  const playerCombatStats = getPlayerCombatStats(state.player);
  const playerResourceRenderToken = getPlayerResourceRenderToken({
    ...playerCombatStats,
    level: state.player.level,
  });
  const playerWorldOffset = getWorldHexSizeOffset({
    hexSize,
    q: state.player.coord.q,
    r: state.player.coord.r,
  });
  const movementTransitionOffset = getMovementTransitionOffset(
    movementTransition,
    hexSize,
  );
  const playerTransitionOffset =
    getMovementTransitionPlayerOffset(movementTransition);
  const worldMapScale =
    typeof scene.worldMap.scale.x === 'number' ? scene.worldMap.scale.x : 1;
  const cloudParallaxOffset = {
    x:
      (movementTransitionOffset.x - playerWorldOffset.x) *
      worldMapScale *
      WORLD_MAP_CLOUD_PARALLAX_FACTOR,
    y:
      (movementTransitionOffset.y - playerWorldOffset.y) *
      worldMapScale *
      WORLD_MAP_CLOUD_PARALLAX_FACTOR,
  };

  applyWorldSceneOffset(scene, movementTransitionOffset);

  if (WORLD_MAP_FISHEYE_ENABLED) {
    scene.worldMapFilterArea.width = app.screen.width;
    scene.worldMapFilterArea.height = app.screen.height;
    updateWorldMapFishEyeFilter(scene.worldMapFilter, app.screen, origin);
  }

  const screenChanged =
    scene.screenWidth !== app.screen.width ||
    scene.screenHeight !== app.screen.height;
  const fullscreenVisualEffects = getFullscreenVisualEffectsState(
    state,
    animationMs,
  );
  const animatedRenderToken = [
    getAnimatedRenderToken(
      {
        activeWorldId: currentWorldId,
        bloodMoonActive: state.bloodMoonActive,
        harvestMoonActive: state.harvestMoonActive,
        seed: state.seed,
      },
      animationMs,
      fullscreenVisualEffects.renderToken,
      worldRenderFrameMs,
    ),
    getMovementCooldownRenderToken(movementCooldown, worldRenderFrameMs),
    getCombatFeedbackRenderToken({
      state,
      worldRenderFrameMs,
      worldTimeMs: renderWorldTimeMs,
    }),
    showClouds ? 'clouds:on' : 'clouds:off',
    `cloudTransparency:${cloudTransparency}`,
  ].join(':');
  const displayVisibleTiles = movementTransition
    ? (movementTransition.displayTiles ?? [
        ...visibleTiles,
        ...movementTransition.outgoingTiles,
      ])
    : visibleTiles;
  const renderTokens = getSceneRenderTokens(
    scene,
    state,
    displayVisibleTiles,
    animationMs,
    worldRenderFrameMs,
  );
  const visibleEnemyBadgeRenderToken = getVisibleEnemyBadgeRenderToken(
    state.combat?.enemyIds,
    renderTokens.visibleTileRenderInputs,
  );
  const staticRenderToken =
    movementTransitionRenderToken === -1
      ? renderTokens.static
      : mixRenderToken(renderTokens.static, movementTransitionRenderToken);
  const shouldRenderStatic =
    screenChanged ||
    scene.staticRenderToken !== staticRenderToken ||
    scene.visibleEnemyBadgeRenderToken !== visibleEnemyBadgeRenderToken;
  const shouldRenderAnimated =
    screenChanged ||
    shouldRenderStatic ||
    scene.animatedRenderToken !== animatedRenderToken;
  const shouldRenderInteraction =
    shouldRenderStatic ||
    scene.playerResourceRenderToken !== playerResourceRenderToken ||
    scene.interactionRenderToken !==
      renderTokens.interactionWithSelection(
        selected,
        hoveredMove,
        hoveredSafePath,
        queuedPath,
      );
  const hoveredSafePathKeys =
    shouldRenderInteraction && hoveredSafePath
      ? new Set(hoveredSafePath.map((coord) => hexKey(coord)))
      : null;
  const queuedPathKeys =
    shouldRenderInteraction && queuedPath
      ? new Set(queuedPath.map((coord) => hexKey(coord)))
      : null;
  const visibleTileMap = shouldRenderStatic
    ? new Map(
        displayVisibleTiles.map((tile) => [hexKey(tile.coord), tile] as const),
      )
    : null;
  const visibleTileRenderInputs = shouldRenderStatic
    ? renderTokens.visibleTileRenderInputs
    : null;
  const lightingState =
    shouldRenderAnimated || shouldRenderStatic
      ? getLightingState(
          app,
          worldTimeMinutes,
          animationMs,
          state.bloodMoonActive,
          state.harvestMoonActive,
        )
      : null;
  const shadowOffset =
    currentWorldKind === 'dungeon'
      ? ZERO_SHADOW_OFFSET
      : (lightingState?.shadowOffset ?? ZERO_SHADOW_OFFSET);

  if (shouldRenderAnimated && lightingState) {
    renderSkyLayer(
      app,
      scene.skyFill,
      currentWorldKind === 'dungeon'
        ? 0x0b1220
        : lightingState.lighting.skyColor,
    );
    beginAnimatedSceneRender(scene);
    renderAtmosphere(
      app,
      scene.atmosphereShaftGraphics,
      scene.atmosphereCelestialGraphics,
      lightingState.lighting,
      animationMs,
      lightingState.sunPosition,
      lightingState.moonPosition,
      origin,
      currentWorldKind,
      state.bloodMoonActive,
      state.harvestMoonActive,
    );
  }

  if (shouldRenderStatic) {
    beginStaticSceneRender(scene);
  }
  if (shouldRenderInteraction) {
    beginInteractionSceneRender(scene);
  }

  if (shouldRenderStatic || shouldRenderInteraction) {
    renderTilePasses({
      enemyIconSize,
      hexSize,
      currentWorldKind,
      queuedPathKeys,
      hoveredMove,
      hoveredSafePathKeys,
      origin,
      animationMs,
      scene,
      selected,
      shadowOffset,
      shouldRenderInteraction,
      shouldRenderStatic,
      showTerrainBackgrounds,
      state,
      structureIconSize,
      terrainArtSize,
      movementTransition,
      movementTransitionRevealState,
      visibleTileMap,
      visibleTileRenderInputs,
      visibleTiles: displayVisibleTiles,
      worldBossIconSize,
    });
  }

  if (shouldRenderInteraction) {
    renderPlayerResourceBars({
      playerCombatStats,
      playerIconSize,
      playerLevel: state.player.level,
      scene,
    });
  }

  if (shouldRenderStatic) {
    completeStaticSceneRender(scene);
    scene.staticRenderToken = staticRenderToken;
    scene.visibleEnemyBadgeRenderToken = visibleEnemyBadgeRenderToken;
  }

  if (shouldRenderInteraction) {
    completeInteractionSceneRender(scene);
    scene.interactionRenderToken = renderTokens.interactionWithSelection(
      selected,
      hoveredMove,
      hoveredSafePath,
      queuedPath,
    );
    scene.playerResourceRenderToken = playerResourceRenderToken;
  }

  scene.screenWidth = app.screen.width;
  scene.screenHeight = app.screen.height;

  if (shouldRenderAnimated && lightingState) {
    renderAnimatedScene({
      animationMs,
      animatedRenderToken,
      app,
      cloudTransparency,
      cloudInputs,
      fullscreenVisualEffects,
      hexSize,
      lightingState,
      movementCooldown,
      enemyIconSize,
      cloudParallaxOffset,
      origin,
      playerIconSize,
      playerTransitionOffset,
      scene,
      playerCoord: state.player.coord,
      state,
      movementTransitionRevealState,
      showClouds,
      visibleTileRenderInputs: renderTokens.visibleTileRenderInputs,
      worldKind: currentWorldKind,
      worldTimeMs: renderWorldTimeMs,
    });
  }

  recordPixiRenderCounts(scene.renderCounts);
}

function getMovementCooldownRenderToken(
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

function getMovementTransitionRenderToken(
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

function getMovementTransitionOffset(
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

function getMovementTransitionPlayerOffset(
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

function getWorldHexSizeOffset({
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

function mixRenderToken(token: number, value: number) {
  return Math.imul(token ^ value, 16777619) >>> 0;
}

function normalizeRenderCloudTransparency(value: number | undefined) {
  const numericValue = typeof value === 'number' ? value : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

function getPlayerResourceRenderToken({
  hp,
  level,
  mana,
  maxHp,
  maxMana,
}: Pick<
  ReturnType<typeof getPlayerCombatStats>,
  'hp' | 'mana' | 'maxHp' | 'maxMana'
> & {
  level: number;
}) {
  return [level, hp, maxHp, mana, maxMana].join(':');
}

function getVisibleEnemyBadgeRenderToken(
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
