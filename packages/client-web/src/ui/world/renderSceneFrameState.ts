import { type Application } from 'pixi.js';
import { getActiveWorld } from '@realmfall/core/game/dungeons/worldState';
import { getCurrentWorldRevealRadius } from '@realmfall/core/game/stateOutposts';
import { getPlayerCombatStats } from '@realmfall/core/game/stateSelectors';
import type {
  GameState,
  HexCoord,
  WorldKind,
} from '@realmfall/core/game/stateTypes';
import {
  getCloudRenderInputs,
  getAnimatedRenderToken,
} from './renderSceneShared';
import { getFullscreenVisualEffectsState } from './renderSceneFullscreenEffects';
import {
  DEFAULT_WORLD_RENDER_FPS,
  getWorldRenderFrameMs,
} from './renderCadence';
import { getCombatFeedbackRenderToken } from './renderSceneCombatFeedback';
import { getSceneRenderTokens } from './renderSceneTokens';
import { getWorldHexSize } from './renderSceneMath';
import { syncDungeonEnemyMovementTransitions } from './renderSceneDungeonEnemyTransitions';
import {
  getSceneIconTransitionRenderToken,
  PLAYER_ICON_TRANSITION_KEY,
  WORLD_MARKER_ICON_TRANSITION_KEY_PREFIX,
} from './renderSceneIconTransitions';
import { getMovementTransitionRevealState } from './renderSceneVisibility';
import { applyWorldSceneOffset, getSceneCache } from './renderSceneCache';
import {
  getMovementCooldownRenderToken,
  getMovementTransitionOffset,
  getMovementTransitionPlayerOffset,
  getMovementTransitionRenderToken,
  getPlayerResourceRenderToken,
  getVisibleEnemyBadgeRenderToken,
  getWorldHexSizeOffset,
  mixRenderToken,
  type RenderSceneMovementCooldown,
  type RenderSceneMovementTransition,
} from './renderSceneMovementTokens';
import {
  updateWorldMapFishEyeFilter,
  WORLD_MAP_FISHEYE_ENABLED,
} from './worldMapFishEyeRuntime';
import { WORLD_MAP_CLOUD_PARALLAX_FACTOR } from './renderSceneShared';
import type { VisibleWorldTile } from './visibleWorldTiles';

export interface RenderSceneOptions {
  combatFeedbackWorldTimeMs?: number;
  cloudTransparency?: number;
  idleAnimationMs?: number;
  showTerrainBackgrounds?: boolean;
  showClouds?: boolean;
  queuedPath?: HexCoord[] | null;
  worldRenderFps?: number;
  worldTimeMs?: number;
  movementCooldown?: RenderSceneMovementCooldown | null;
  movementTransition?: RenderSceneMovementTransition | null;
}

export interface RenderSceneFrameState {
  app: Application;
  animationMs: number;
  combatFeedbackWorldTimeMs: number;
  idleAnimationMs: number;
  worldTimeMinutes: number;
  worldTimeMs: number;
  selected: HexCoord;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  queuedPath: HexCoord[] | null;
  worldRenderFrameMs: number;
  showClouds: boolean;
  cloudTransparency: number;
  showTerrainBackgrounds: boolean;
  movementCooldown: RenderSceneMovementCooldown | null;
  movementTransition: RenderSceneMovementTransition | null;
  state: GameState;
  scene: ReturnType<typeof getSceneCache>;
  currentWorldKind: WorldKind;
  currentWorldId: string;
  revealRadius: number;
  worldMapScale: number;
  screenWidth: number;
  screenHeight: number;
  playerCombatStats: ReturnType<typeof getPlayerCombatStats>;
  playerResourceRenderToken: string;
  movementTransitionOffset: { x: number; y: number };
  playerTransitionOffset: { x: number; y: number };
  movementTransitionRevealState: ReturnType<
    typeof getMovementTransitionRevealState
  >;
  cloudInputs: ReturnType<typeof getCloudRenderInputs>;
  cloudParallaxOffset: { x: number; y: number };
  screenChanged: boolean;
  fullscreenVisualEffects: ReturnType<typeof getFullscreenVisualEffectsState>;
  animatedRenderToken: string;
  displayVisibleTiles: VisibleWorldTile[];
  renderTokens: ReturnType<typeof getSceneRenderTokens>;
  visibleEnemyBadgeRenderToken: number;
  staticRenderToken: number;
  structureIconSize: number;
  enemyIconSize: number;
  worldBossIconSize: number;
  playerIconSize: number;
  terrainArtSize: number;
  hexSize: number;
  origin: { x: number; y: number };
}

export function getRenderSceneFrameState({
  app,
  state,
  visibleTiles,
  selected,
  hoveredMove,
  worldTimeMinutes = 12 * 60,
  animationMs = 0,
  hoveredSafePath = null,
  options,
}: {
  app: Application;
  state: GameState;
  visibleTiles: VisibleWorldTile[];
  selected: HexCoord;
  hoveredMove: HexCoord | null;
  worldTimeMinutes?: number;
  animationMs?: number;
  hoveredSafePath?: HexCoord[] | null;
  options: RenderSceneOptions;
}): RenderSceneFrameState {
  const scene = getSceneCache(app);
  const worldRenderFrameMs = getWorldRenderFrameMs(
    options.worldRenderFps ?? DEFAULT_WORLD_RENDER_FPS,
  );
  const worldTimeMs = options.worldTimeMs ?? state.worldTimeMs;
  const combatFeedbackWorldTimeMs =
    options.combatFeedbackWorldTimeMs ?? worldTimeMs;
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
  const idleAnimationMs = options.idleAnimationMs ?? animationMs;
  const cloudTransparency = normalizeRenderCloudTransparency(
    options.cloudTransparency,
  );
  const showTerrainBackgrounds = options.showTerrainBackgrounds ?? true;
  const queuedPath = options.queuedPath ?? null;
  const movementCooldown = options.movementCooldown ?? null;
  const movementTransition = options.movementTransition ?? null;

  syncDungeonEnemyMovementTransitions(scene, state, idleAnimationMs);

  const movementTransitionOffset = getMovementTransitionOffset(
    movementTransition,
    hexSize,
  );
  const playerTransitionOffset =
    getMovementTransitionPlayerOffset(movementTransition);
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
  const worldMapScale =
    typeof scene.worldMap.scale.x === 'number' ? scene.worldMap.scale.x : 1;
  const movementTransitionRenderToken = getMovementTransitionRenderToken(
    movementTransition,
    worldRenderFrameMs,
  );
  const movementTransitionOffsetDelta = {
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
    idleAnimationMs,
  );
  const staticRenderBaseToken = getAnimatedRenderToken(
    {
      activeWorldId: currentWorldId,
      bloodMoonActive: state.bloodMoonActive,
      harvestMoonActive: state.harvestMoonActive,
      seed: state.seed,
    },
    idleAnimationMs,
    fullscreenVisualEffects.renderToken,
    worldRenderFrameMs,
  );
  const playerIconTransitionRenderToken = getSceneIconTransitionRenderToken(
    scene.iconTransitionsByKey,
    idleAnimationMs,
    PLAYER_ICON_TRANSITION_KEY,
  );
  const animatedRenderTokenParts = [
    staticRenderBaseToken,
    `atmosphere:${Math.floor(animationMs / worldRenderFrameMs)}`,
    getMovementCooldownRenderToken(movementCooldown, worldRenderFrameMs),
    getCombatFeedbackRenderToken({
      renderWorldTimeMs: combatFeedbackWorldTimeMs,
      state,
      worldRenderFrameMs,
    }),
    showClouds ? 'clouds:on' : 'clouds:off',
    `cloudTransparency:${cloudTransparency}`,
  ];
  if (playerIconTransitionRenderToken !== null) {
    animatedRenderTokenParts.push(
      `player-icons:${playerIconTransitionRenderToken}`,
    );
  }
  const animatedRenderToken = animatedRenderTokenParts.join(':');
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
    idleAnimationMs,
    worldRenderFrameMs,
  );
  const visibleEnemyBadgeRenderToken = getVisibleEnemyBadgeRenderToken(
    state.combat?.enemyIds,
    renderTokens.visibleTileRenderInputs,
  );
  const worldMarkerIconTransitionRenderToken =
    getSceneIconTransitionRenderToken(
      scene.iconTransitionsByKey,
      idleAnimationMs,
      WORLD_MARKER_ICON_TRANSITION_KEY_PREFIX,
    );
  let staticRenderToken =
    movementTransitionRenderToken === -1
      ? renderTokens.static
      : mixRenderToken(renderTokens.static, movementTransitionRenderToken);
  if (worldMarkerIconTransitionRenderToken !== null) {
    staticRenderToken = mixRenderToken(
      staticRenderToken,
      worldMarkerIconTransitionRenderToken,
    );
  }

  return {
    app,
    animationMs,
    combatFeedbackWorldTimeMs,
    idleAnimationMs,
    worldTimeMinutes,
    worldTimeMs,
    selected,
    hoveredMove,
    hoveredSafePath,
    queuedPath,
    worldRenderFrameMs,
    showClouds,
    cloudTransparency,
    showTerrainBackgrounds,
    movementCooldown,
    movementTransition,
    state,
    scene,
    currentWorldKind,
    currentWorldId,
    revealRadius: getCurrentWorldRevealRadius(state),
    worldMapScale,
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
    playerCombatStats,
    playerResourceRenderToken,
    movementTransitionOffset,
    playerTransitionOffset,
    movementTransitionRevealState,
    cloudInputs,
    cloudParallaxOffset: movementTransitionOffsetDelta,
    screenChanged,
    fullscreenVisualEffects,
    animatedRenderToken,
    displayVisibleTiles,
    renderTokens,
    visibleEnemyBadgeRenderToken,
    staticRenderToken,
    structureIconSize,
    enemyIconSize,
    worldBossIconSize,
    playerIconSize,
    terrainArtSize,
    hexSize,
    origin,
  };
}

function normalizeRenderCloudTransparency(value: number | undefined) {
  const numericValue = typeof value === 'number' ? value : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}
