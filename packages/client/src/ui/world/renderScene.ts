import { type Application } from 'pixi.js';
import { hexKey } from '../../game/hex';
import { getPlayerCombatStats } from '../../game/stateSelectors';
import type { GameState, HexCoord } from '../../game/stateTypes';
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
import { renderTilePasses } from './renderSceneTilePasses';
import { renderAnimatedScene } from './renderSceneAnimated';
import { renderPlayerResourceBars } from './renderScenePlayerBars';
import {
  DEFAULT_WORLD_RENDER_FPS,
  getWorldRenderFrameMs,
} from './renderCadence';
import type { VisibleWorldTile } from './visibleWorldTiles';

interface RenderSceneOptions {
  showTerrainBackgrounds?: boolean;
  queuedPath?: HexCoord[] | null;
  worldRenderFps?: number;
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
  const cloudInputs = getCloudRenderInputs(scene, state.seed);
  const origin = {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
  };
  const hexSize = getWorldHexSize(app.screen, state.radius);
  const structureIconSize = hexSize * 1.065;
  const enemyIconSize = hexSize * 0.945;
  const worldBossIconSize = hexSize * 3.4;
  const playerIconSize = hexSize * 1.58;
  const terrainArtSize = hexSize * 2;
  const showTerrainBackgrounds = options.showTerrainBackgrounds ?? true;
  const worldRenderFrameMs = getWorldRenderFrameMs(
    options.worldRenderFps ?? DEFAULT_WORLD_RENDER_FPS,
  );
  const queuedPath = options.queuedPath ?? null;
  const movementCooldown = options.movementCooldown ?? null;
  const movementTransition = options.movementTransition ?? null;
  const movementTransitionRenderToken = getMovementTransitionRenderToken(
    movementTransition,
    worldRenderFrameMs,
  );
  const playerCombatStats = getPlayerCombatStats(state.player);
  const playerResourceRenderToken =
    getPlayerResourceRenderToken(playerCombatStats);
  const playerWorldOffset = getWorldHexSizeOffset({
    hexSize,
    q: state.player.coord.q,
    r: state.player.coord.r,
  });
  const movementTransitionOffset = getMovementTransitionOffset(
    movementTransition,
    hexSize,
  );
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
      state,
      animationMs,
      fullscreenVisualEffects.renderToken,
      worldRenderFrameMs,
    ),
    getMovementCooldownRenderToken(movementCooldown, worldRenderFrameMs),
  ].join(':');
  const shouldRenderAnimated =
    screenChanged || scene.animatedRenderToken !== animatedRenderToken;
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
  const staticRenderToken =
    movementTransitionRenderToken === -1
      ? renderTokens.static
      : mixRenderToken(renderTokens.static, movementTransitionRenderToken);
  const shouldRenderStatic =
    screenChanged || scene.staticRenderToken !== staticRenderToken;
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
  const shadowOffset = lightingState?.shadowOffset ?? ZERO_SHADOW_OFFSET;

  if (shouldRenderAnimated && lightingState) {
    renderSkyLayer(app, scene.skyFill, lightingState.lighting.skyColor);
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
      visibleTileMap,
      visibleTileRenderInputs,
      visibleTiles: displayVisibleTiles,
      worldBossIconSize,
    });
  }

  if (shouldRenderInteraction) {
    renderPlayerResourceBars({
      hexSize,
      origin,
      playerCombatStats,
      playerIconSize,
      scene,
    });
  }

  if (shouldRenderStatic) {
    completeStaticSceneRender(scene);
    scene.staticRenderToken = staticRenderToken;
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
      cloudInputs,
      fullscreenVisualEffects,
      hexSize,
      lightingState,
      movementCooldown,
      cloudParallaxOffset,
      origin,
      playerIconSize,
      scene,
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

function getPlayerResourceRenderToken({
  hp,
  mana,
  maxHp,
  maxMana,
}: Pick<
  ReturnType<typeof getPlayerCombatStats>,
  'hp' | 'mana' | 'maxHp' | 'maxMana'
>) {
  return [hp, maxHp, mana, maxMana].join(':');
}
