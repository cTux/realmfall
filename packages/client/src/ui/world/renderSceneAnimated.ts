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
    hexSize,
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
  hexSize,
  origin,
  playerIconSize,
  movementCooldown,
}: {
  scene: SceneCache;
  hexSize: number;
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
  const edgeStart = {
    x: origin.x + Math.cos(Math.PI / 6) * hexSize,
    y: origin.y + Math.sin(Math.PI / 6) * hexSize,
  };
  const edgeEnd = {
    x: origin.x + Math.cos(Math.PI / 2) * hexSize,
    y: origin.y + Math.sin(Math.PI / 2) * hexSize,
  };
  const edgeVector = {
    x: edgeEnd.x - edgeStart.x,
    y: edgeEnd.y - edgeStart.y,
  };
  const edgeLength = Math.hypot(edgeVector.x, edgeVector.y) || 1;
  const edgeDirection = {
    x: edgeVector.x / edgeLength,
    y: edgeVector.y / edgeLength,
  };
  const inwardNormal = {
    x: -edgeDirection.y,
    y: edgeDirection.x,
  };
  const thickness = Math.max(3, playerIconSize * 0.075);
  const start = edgeStart;
  const end = edgeEnd;
  const fillEnd = {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };

  takeGraphics(scene.playerCooldownGraphics)
    .poly(buildMovementCooldownQuad(start, end, inwardNormal, thickness))
    .fill({ color: 0x422006, alpha: 0.85 });

  takeGraphics(scene.playerCooldownGraphics)
    .poly(buildMovementCooldownQuad(start, fillEnd, inwardNormal, thickness))
    .fill({ color: 0xfacc15, alpha: 0.95 });
}

function buildMovementCooldownQuad(
  start: { x: number; y: number },
  end: { x: number; y: number },
  inwardNormal: { x: number; y: number },
  thickness: number,
) {
  return [
    start.x,
    start.y,
    end.x,
    end.y,
    end.x + inwardNormal.x * thickness,
    end.y + inwardNormal.y * thickness,
    start.x + inwardNormal.x * thickness,
    start.y + inwardNormal.y * thickness,
  ];
}
