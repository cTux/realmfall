import { type Application } from 'pixi.js';
import type {
  GameState,
  HexCoord,
  WorldKind,
} from '@realmfall/core/game/stateTypes';
import { scaleColor } from './timeOfDay';
import { animateWorldMarkers } from './renderSceneMarkerAnimations';
import {
  renderCampfireLight,
  renderCloudLayer,
} from './renderSceneEnvironment';
import { configureShadowedSprite } from './renderScenePools';
import { renderWorldOverlay } from './renderSceneAtmosphere';
import {
  completeAnimatedSceneRender,
  type SceneCache,
} from './renderSceneCache';
import {
  getCombatLungeOffset,
  renderSceneCombatFeedback,
} from './renderSceneCombatFeedback';
import {
  renderDungeonEnemyMovementCooldowns,
  renderPlayerMovementCooldown,
} from './renderScenePlayerBars';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import type { MovementTransitionRevealState } from './renderSceneVisibility';

interface RenderAnimatedSceneOptions {
  app: Application;
  scene: SceneCache;
  animationMs: number;
  animatedRenderToken: string;
  cloudTransparency: number;
  cloudInputs: ReturnType<
    typeof import('./renderSceneEnvironment').buildCloudRenderInputs
  >;
  fullscreenVisualEffects: ReturnType<
    typeof import('./renderSceneFullscreenEffects').getFullscreenVisualEffectsState
  >;
  hexSize: number;
  lightingState: NonNullable<
    ReturnType<typeof import('./renderSceneAtmosphere').getLightingState>
  >;
  movementCooldown: {
    durationMs: number;
    endAtMs: number;
    nowMs: number;
  } | null;
  enemyIconSize: number;
  movementTransitionRevealState: MovementTransitionRevealState | null;
  playerCoord: HexCoord;
  revealRadius: number;
  cloudParallaxOffset: { x: number; y: number };
  origin: { x: number; y: number };
  playerIconSize: number;
  playerTransitionOffset: { x: number; y: number };
  state: GameState;
  showClouds: boolean;
  visibleTileRenderInputs: VisibleTileRenderInput[];
  worldKind: WorldKind;
  worldTimeMs: number;
}

export function renderAnimatedScene({
  app,
  scene,
  animationMs,
  animatedRenderToken,
  cloudTransparency,
  cloudInputs,
  fullscreenVisualEffects,
  hexSize,
  lightingState,
  movementCooldown,
  enemyIconSize,
  movementTransitionRevealState,
  playerCoord,
  revealRadius,
  cloudParallaxOffset,
  origin,
  playerIconSize,
  playerTransitionOffset,
  state,
  showClouds,
  visibleTileRenderInputs,
  worldKind,
  worldTimeMs,
}: RenderAnimatedSceneOptions) {
  animateWorldMarkers(
    scene.animatedWorldMarkers,
    animationMs,
    lightingState.lighting,
  );

  scene.campfireLightPoints.forEach((point) => {
    renderCampfireLight(
      scene.worldAnimatedDetailGraphics,
      point,
      hexSize,
      lightingState.lighting.ambientBrightness,
      lightingState.lighting,
      animationMs,
      point.alpha,
    );
  });

  const combatLungeOffset = getCombatLungeOffset({
    hexSize,
    state,
    worldTimeMs,
  });
  const playerLungeOffset = {
    x: combatLungeOffset.x + playerTransitionOffset.x,
    y: combatLungeOffset.y + playerTransitionOffset.y,
  };
  const playerOrigin = {
    x: origin.x + playerLungeOffset.x,
    y: origin.y + playerLungeOffset.y,
  };

  configureShadowedSprite(
    scene.player,
    scaleColor(
      0xffffff,
      Math.max(0.84, lightingState.lighting.ambientBrightness + 0.08),
    ),
    playerIconSize,
    playerIconSize,
    1,
    lightingState.shadowOffset,
    playerOrigin,
  );
  renderPlayerMovementCooldown({
    scene,
    playerIconSize,
    movementCooldown,
  });
  renderDungeonEnemyMovementCooldowns({
    scene,
    enemyIconSize,
    movementTransitionRevealState,
    playerCoord,
    revealRadius,
    visibleTileRenderInputs,
    worldKind,
    worldTimeMs,
  });
  renderSceneCombatFeedback({
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
  });

  renderCloudLayer(
    app.screen,
    scene.cloudShadowSprites,
    scene.cloudSprites,
    animationMs,
    lightingState.lighting,
    cloudInputs,
    lightingState.shadowOffset,
    cloudParallaxOffset,
    showClouds,
    cloudTransparency,
  );
  renderWorldOverlay(
    app,
    scene.overlayFill,
    lightingState.lighting.overlayColor,
    lightingState.lighting.overlayAlpha,
  );
  renderWorldOverlay(
    app,
    scene.fullscreenEffectFill,
    fullscreenVisualEffects.overlay?.color ?? 0,
    fullscreenVisualEffects.overlay?.alpha ?? 0,
  );
  completeAnimatedSceneRender(scene);
  scene.animatedRenderToken = animatedRenderToken;
}
