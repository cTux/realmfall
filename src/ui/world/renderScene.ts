import { type Application } from 'pixi.js';
import { getVisibleTiles } from '../../game/stateSelectors';
import { hexKey } from '../../game/hex';
import type { GameState, HexCoord } from '../../game/stateTypes';
import {
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
  ZERO_SHADOW_OFFSET,
} from './renderSceneShared';
import { renderTilePasses } from './renderSceneTilePasses';
import { renderAnimatedScene } from './renderSceneAnimated';

interface RenderSceneOptions {
  showTerrainBackgrounds?: boolean;
}

export function renderScene(
  app: Application,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
  selected: HexCoord,
  hoveredMove: HexCoord | null,
  worldTimeMinutes = 12 * 60,
  animationMs = 0,
  hoveredSafePath: HexCoord[] | null = null,
  options: RenderSceneOptions = {},
) {
  const scene = getSceneCache(app);
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
  const animatedRenderToken = getAnimatedRenderToken(
    state,
    animationMs,
    fullscreenVisualEffects.renderToken,
  );
  const shouldRenderAnimated =
    screenChanged || scene.animatedRenderToken !== animatedRenderToken;
  const renderTokens = getSceneRenderTokens(scene, state, visibleTiles);
  const shouldRenderStatic =
    screenChanged || scene.staticRenderToken !== renderTokens.static;
  const shouldRenderInteraction =
    shouldRenderStatic ||
    scene.interactionRenderToken !==
      renderTokens.interactionWithSelection(
        selected,
        hoveredMove,
        hoveredSafePath,
      );
  const hoveredSafePathKeys =
    shouldRenderInteraction && hoveredSafePath
      ? new Set(hoveredSafePath.map((coord) => hexKey(coord)))
      : null;
  const visibleTileMap = shouldRenderStatic
    ? new Map(visibleTiles.map((tile) => [hexKey(tile.coord), tile] as const))
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
      hoveredMove,
      hoveredSafePathKeys,
      origin,
      scene,
      selected,
      shadowOffset,
      shouldRenderInteraction,
      shouldRenderStatic,
      showTerrainBackgrounds,
      state,
      structureIconSize,
      terrainArtSize,
      visibleTileMap,
      visibleTileRenderInputs,
      visibleTiles,
      worldBossIconSize,
    });
  }

  if (shouldRenderStatic) {
    completeStaticSceneRender(scene);
    scene.staticRenderToken = renderTokens.static;
  }

  if (shouldRenderInteraction) {
    completeInteractionSceneRender(scene);
    scene.interactionRenderToken = renderTokens.interactionWithSelection(
      selected,
      hoveredMove,
      hoveredSafePath,
    );
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
      origin,
      playerIconSize,
      scene,
    });
  }
}
