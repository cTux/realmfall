import { type Application, type Graphics } from 'pixi.js';
import { getTimeOfDayLighting, scaleColor } from './timeOfDay';
import {
  blendLightSources,
  getCelestialPosition,
  lerp,
  normalizeVector,
} from './renderSceneMath';
import { takeGraphics, type GraphicsPool } from './renderScenePools';

let smoothedShadowSource: { x: number; y: number } | null = null;
let lastShadowAnimationMs: number | null = null;

export function getLightingState(
  app: Application,
  worldTimeMinutes: number,
  animationMs: number,
) {
  const lighting = getTimeOfDayLighting(worldTimeMinutes);
  const originX = app.screen.width / 2;
  const originY = app.screen.height / 2;
  const sunPosition = getCelestialPosition(
    app.screen.width,
    app.screen.height,
    worldTimeMinutes,
  );
  const moonPosition = getCelestialPosition(
    app.screen.width,
    app.screen.height,
    worldTimeMinutes + 12 * 60,
  );
  const targetShadowSource = blendLightSources(
    sunPosition,
    moonPosition,
    lighting.sunOpacity,
    lighting.moonOpacity,
  );
  const shadowSource = smoothShadowSource(targetShadowSource, animationMs);
  const lightVector = normalizeVector({
    x: originX - shadowSource.x,
    y: originY - shadowSource.y,
  });

  return {
    lighting,
    origin: { x: originX, y: originY },
    sunPosition,
    moonPosition,
    shadowOffset: {
      x: lightVector.x * 10,
      y: lightVector.y * 10,
    },
  };
}

export function renderSkyLayer(
  app: Application,
  skyFill: Graphics,
  skyColor: number,
) {
  skyFill.visible = true;
  skyFill.clear();
  skyFill.beginFill(skyColor, 1);
  skyFill.drawRect(0, 0, app.screen.width, app.screen.height);
  skyFill.endFill();
}

export function renderAtmosphere(
  app: Application,
  graphicsPool: GraphicsPool,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  animationMs: number,
  sunPosition: { x: number; y: number },
  moonPosition: { x: number; y: number },
  focalPoint: { x: number; y: number },
) {
  if (lighting.shaftAlpha > 0.01) {
    renderLightShafts(
      app,
      graphicsPool,
      animationMs,
      sunPosition,
      focalPoint,
      0xfbbf24,
      lighting.shaftAlpha * lighting.sunShaftOpacity,
    );
    renderLightShafts(
      app,
      graphicsPool,
      animationMs,
      moonPosition,
      focalPoint,
      0xcbd5ff,
      lighting.shaftAlpha * lighting.moonShaftOpacity,
    );
  }

  renderCelestialBody(
    graphicsPool,
    moonPosition,
    scaleColor(0xdbeafe, lighting.ambientBrightness + 0.1),
    lighting.moonOpacity * lighting.celestialAlpha * 0.72,
    24,
  );
  renderCelestialBody(
    graphicsPool,
    sunPosition,
    scaleColor(0xfff7d6, lighting.ambientBrightness + 0.08),
    lighting.sunOpacity * lighting.celestialAlpha,
    30,
  );
}

export function renderWorldOverlay(
  app: Application,
  overlayFill: Graphics,
  color: number,
  alpha: number,
) {
  if (alpha <= 0) {
    overlayFill.visible = false;
    overlayFill.clear();
    return;
  }

  overlayFill.visible = true;
  overlayFill.clear();
  overlayFill.beginFill(color, alpha);
  overlayFill.drawRect(0, 0, app.screen.width, app.screen.height);
  overlayFill.endFill();
}

function renderLightShafts(
  app: Application,
  graphicsPool: GraphicsPool,
  animationMs: number,
  sourcePosition: { x: number; y: number },
  focalPoint: { x: number; y: number },
  tint: number,
  opacity: number,
) {
  if (opacity <= 0.01) return;

  const shaftDrift = Math.sin(animationMs * 0.00035) * 24;
  const shaftConfigs = [
    { width: 90, reach: 0.62, alpha: opacity * 0.6 },
    { width: 140, reach: 0.74, alpha: opacity * 0.38 },
    { width: 210, reach: 0.88, alpha: opacity * 0.22 },
  ];

  shaftConfigs.forEach((shaft, index) => {
    const beam = takeGraphics(graphicsPool);
    const spread = shaft.width + index * 34;
    const focusPoint = {
      x: focalPoint.x + shaftDrift * (0.5 + index * 0.18),
      y: focalPoint.y + app.screen.height * (shaft.reach - 0.6),
    };
    const beamVector = normalizeVector({
      x: focusPoint.x - sourcePosition.x,
      y: focusPoint.y - sourcePosition.y,
    });
    const perpendicular = { x: -beamVector.y, y: beamVector.x };
    const nearSpread = 14 + index * 6;
    beam.beginFill(tint, shaft.alpha);
    beam.drawPolygon([
      sourcePosition.x - perpendicular.x * nearSpread,
      sourcePosition.y - perpendicular.y * nearSpread,
      sourcePosition.x + perpendicular.x * nearSpread,
      sourcePosition.y + perpendicular.y * nearSpread,
      focusPoint.x + perpendicular.x * spread,
      focusPoint.y + perpendicular.y * spread,
      focusPoint.x - perpendicular.x * spread,
      focusPoint.y - perpendicular.y * spread,
    ]);
    beam.endFill();
  });
}

function renderCelestialBody(
  graphicsPool: GraphicsPool,
  position: { x: number; y: number },
  tint: number,
  alpha: number,
  radius: number,
) {
  if (alpha <= 0.01) return;

  const haloLayers = [
    { scale: 4.2, alpha: 0.025 },
    { scale: 3.75, alpha: 0.04 },
    { scale: 3.3, alpha: 0.06 },
    { scale: 2.9, alpha: 0.085 },
    { scale: 2.5, alpha: 0.12 },
    { scale: 2.15, alpha: 0.16 },
    { scale: 1.8, alpha: 0.22 },
    { scale: 1.48, alpha: 0.3 },
  ];

  haloLayers.forEach((halo) => {
    const glow = takeGraphics(graphicsPool);
    glow.beginFill(tint, alpha * halo.alpha);
    glow.drawEllipse(
      position.x,
      position.y,
      radius * halo.scale,
      radius * halo.scale,
    );
    glow.endFill();
  });

  const glow = takeGraphics(graphicsPool);
  glow.beginFill(tint, alpha * 0.34);
  glow.drawEllipse(position.x, position.y, radius * 1.18, radius * 1.18);
  glow.endFill();

  const body = takeGraphics(graphicsPool);
  body.beginFill(tint, alpha);
  body.drawEllipse(position.x, position.y, radius, radius);
  body.endFill();
}

function smoothShadowSource(
  target: { x: number; y: number },
  animationMs: number,
) {
  if (smoothedShadowSource == null || lastShadowAnimationMs == null) {
    smoothedShadowSource = { ...target };
    lastShadowAnimationMs = animationMs;
    return smoothedShadowSource;
  }

  const deltaMs = Math.max(
    0,
    Math.min(1000, animationMs - lastShadowAnimationMs),
  );
  const progress = Math.min(1, deltaMs / 1000);
  smoothedShadowSource = {
    x: lerp(smoothedShadowSource.x, target.x, progress),
    y: lerp(smoothedShadowSource.y, target.y, progress),
  };
  lastShadowAnimationMs = animationMs;
  return smoothedShadowSource;
}
