import { type Application } from 'pixi.js';
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
  origin: { x: number; y: number };
  playerIconSize: number;
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
  origin,
  playerIconSize,
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

  renderCloudLayer(
    app.screen,
    scene.cloudShadowSprites,
    scene.cloudSprites,
    animationMs,
    lightingState.lighting,
    cloudInputs,
    lightingState.shadowOffset,
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
