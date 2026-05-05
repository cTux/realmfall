import { type Application } from 'pixi.js';
import type { HexCoord, WorldKind } from '../../game/stateTypes';
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
  movementTransitionRevealState: MovementTransitionRevealState | null;
  playerCoord: HexCoord;
  cloudParallaxOffset: { x: number; y: number };
  origin: { x: number; y: number };
  playerIconSize: number;
  visibleTileRenderInputs: VisibleTileRenderInput[];
  worldKind: WorldKind;
  worldTimeMs: number;
}

export function renderAnimatedScene({
  app,
  scene,
  animationMs,
  animatedRenderToken,
  cloudInputs,
  fullscreenVisualEffects,
  hexSize,
  lightingState,
  movementCooldown,
  movementTransitionRevealState,
  playerCoord,
  cloudParallaxOffset,
  origin,
  playerIconSize,
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
    );
  });

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
    origin,
  );
  renderPlayerMovementCooldown({
    scene,
    hexSize,
    origin,
    playerIconSize,
    movementCooldown,
  });
  renderDungeonEnemyMovementCooldowns({
    scene,
    hexSize,
    movementTransitionRevealState,
    origin,
    playerCoord,
    visibleTileRenderInputs,
    worldKind,
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
