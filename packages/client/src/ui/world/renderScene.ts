import { type Application } from 'pixi.js';
import { recordPixiRenderCounts } from '../../performance/performanceHarness';
import type { GameState, HexCoord } from '@realmfall/core/game/stateTypes';
import { renderTilePasses } from './renderSceneTilePasses';
import {
  completeInteractionSceneRender,
  completeStaticSceneRender,
  beginAnimatedSceneRender,
  beginInteractionSceneRender,
  beginStaticSceneRender,
} from './renderSceneCache';
import { renderAtmosphere, renderSkyLayer } from './renderSceneAtmosphere';
import { renderAnimatedScene } from './renderSceneAnimated';
import { renderPlayerResourceBars } from './renderScenePlayerBars';
import { RenderSceneOptions } from './renderSceneFrameState';
import { getRenderSceneFrameState } from './renderSceneFrameState';
import { getRenderScenePhasePlan } from './renderScenePhasePlan';
import type { VisibleWorldTile } from './visibleWorldTiles';

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
  const frameState = getRenderSceneFrameState({
    app,
    state,
    visibleTiles,
    selected,
    hoveredMove,
    worldTimeMinutes,
    animationMs,
    hoveredSafePath,
    options,
  });
  const phasePlan = getRenderScenePhasePlan(frameState);
  const { scene } = frameState;

  scene.renderCounts.total += 1;

  if (phasePlan.shouldRenderAnimated && phasePlan.lightingState) {
    renderSkyLayer(
      app,
      scene.skyFill,
      frameState.currentWorldKind === 'dungeon'
        ? 0x0b1220
        : phasePlan.lightingState.lighting.skyColor,
    );
    beginAnimatedSceneRender(scene);
    renderAtmosphere(
      app,
      scene.atmosphereShaftGraphics,
      scene.atmosphereCelestialGraphics,
      phasePlan.lightingState.lighting,
      animationMs,
      phasePlan.lightingState.sunPosition,
      phasePlan.lightingState.moonPosition,
      frameState.origin,
      frameState.currentWorldKind,
      frameState.state.bloodMoonActive,
      frameState.state.harvestMoonActive,
    );
  }

  if (phasePlan.shouldRenderStatic) {
    beginStaticSceneRender(scene);
  }
  if (phasePlan.shouldRenderInteraction) {
    beginInteractionSceneRender(scene);
  }

  if (phasePlan.shouldRenderTilePasses) {
    renderTilePasses({
      enemyIconSize: frameState.enemyIconSize,
      hexSize: frameState.hexSize,
      currentWorldKind: frameState.currentWorldKind,
      queuedPathKeys: phasePlan.queuedPathKeys,
      revealRadius: frameState.revealRadius,
      hoveredMove,
      hoveredSafePathKeys: phasePlan.hoveredSafePathKeys,
      origin: frameState.origin,
      animationMs,
      scene,
      selected,
      shadowOffset: phasePlan.shadowOffset,
      shouldRenderInteraction: phasePlan.shouldRenderInteraction,
      shouldRenderStatic: phasePlan.shouldRenderStatic,
      showTerrainBackgrounds: frameState.showTerrainBackgrounds,
      state,
      structureIconSize: frameState.structureIconSize,
      terrainArtSize: frameState.terrainArtSize,
      movementTransition: frameState.movementTransition,
      movementTransitionRevealState: frameState.movementTransitionRevealState,
      visibleTileMap: phasePlan.visibleTileMap,
      visibleTileRenderInputs: phasePlan.visibleTileRenderInputs,
      visibleTiles: frameState.displayVisibleTiles,
      worldBossIconSize: frameState.worldBossIconSize,
    });
  }

  if (phasePlan.shouldRenderInteraction) {
    renderPlayerResourceBars({
      playerCombatStats: frameState.playerCombatStats,
      playerIconSize: frameState.playerIconSize,
      playerLevel: frameState.state.player.level,
      scene,
    });
  }

  if (phasePlan.shouldRenderStatic) {
    completeStaticSceneRender(scene);
    scene.staticRenderToken = frameState.staticRenderToken;
    scene.visibleEnemyBadgeRenderToken =
      frameState.visibleEnemyBadgeRenderToken;
  }

  if (phasePlan.shouldRenderInteraction) {
    completeInteractionSceneRender(scene);
    scene.interactionRenderToken = phasePlan.interactionRenderToken;
    scene.playerResourceRenderToken = frameState.playerResourceRenderToken;
  }

  scene.screenWidth = app.screen.width;
  scene.screenHeight = app.screen.height;

  if (phasePlan.shouldRenderAnimated && phasePlan.lightingState) {
    renderAnimatedScene({
      animationMs,
      animatedRenderToken: frameState.animatedRenderToken,
      app,
      cloudTransparency: frameState.cloudTransparency,
      cloudInputs: frameState.cloudInputs,
      fullscreenVisualEffects: frameState.fullscreenVisualEffects,
      hexSize: frameState.hexSize,
      lightingState: phasePlan.lightingState,
      movementCooldown: frameState.movementCooldown,
      enemyIconSize: frameState.enemyIconSize,
      cloudParallaxOffset: frameState.cloudParallaxOffset,
      origin: frameState.origin,
      playerIconSize: frameState.playerIconSize,
      playerTransitionOffset: frameState.playerTransitionOffset,
      revealRadius: frameState.revealRadius,
      scene,
      playerCoord: frameState.state.player.coord,
      state,
      movementTransitionRevealState: frameState.movementTransitionRevealState,
      showClouds: frameState.showClouds,
      visibleTileRenderInputs: frameState.renderTokens.visibleTileRenderInputs,
      worldKind: frameState.currentWorldKind,
      worldTimeMs: frameState.worldTimeMs,
    });
  }

  recordPixiRenderCounts(scene.renderCounts);
}

export type { RenderSceneOptions } from './renderSceneFrameState';
