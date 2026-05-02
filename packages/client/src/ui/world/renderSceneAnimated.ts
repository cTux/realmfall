import { type Application } from 'pixi.js';
import { scaleColor } from './timeOfDay';
import { animateWorldMarkers } from './renderSceneMarkerAnimations';
import {
  renderCampfireLight,
  renderCloudLayer,
} from './renderSceneEnvironment';
import { configureShadowedSprite, takeGraphics } from './renderScenePools';
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
  movementCooldown: {
    durationMs: number;
    endAtMs: number;
    nowMs: number;
  } | null;
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
  movementCooldown,
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
  renderPlayerMovementCooldown({
    scene,
    origin,
    playerIconSize,
    movementCooldown,
  });

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

function renderPlayerMovementCooldown({
  scene,
  origin,
  playerIconSize,
  movementCooldown,
}: {
  scene: SceneCache;
  origin: { x: number; y: number };
  playerIconSize: number;
  movementCooldown: {
    durationMs: number;
    endAtMs: number;
    nowMs: number;
  } | null;
}) {
  if (!movementCooldown) {
    return;
  }

  const remainingMs = Math.max(
    0,
    movementCooldown.endAtMs - movementCooldown.nowMs,
  );
  if (remainingMs <= 0) {
    return;
  }

  const progress = Math.min(1, remainingMs / movementCooldown.durationMs);
  const width = playerIconSize * 0.9;
  const height = Math.max(3, playerIconSize * 0.12);
  const x = origin.x - width / 2;
  const y = origin.y + playerIconSize * 0.46;

  takeGraphics(scene.playerCooldownGraphics)
    .rect(x, y, width, height)
    .fill({ color: 0x422006, alpha: 0.85 });

  takeGraphics(scene.playerCooldownGraphics)
    .rect(x, y, width * progress, height)
    .fill({ color: 0xfacc15, alpha: 0.95 });
}
