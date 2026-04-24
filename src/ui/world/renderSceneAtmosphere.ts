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

const LIGHT_SHAFT_CONFIGS = [
  { width: 90, reach: 0.62, alphaMultiplier: 0.6 },
  { width: 140, reach: 0.74, alphaMultiplier: 0.38 },
  { width: 210, reach: 0.88, alphaMultiplier: 0.22 },
] as const;
const CELESTIAL_HALO_LAYERS = [
  { scale: 4.2, alphaMultiplier: 0.025 },
  { scale: 3.75, alphaMultiplier: 0.04 },
  { scale: 3.3, alphaMultiplier: 0.06 },
  { scale: 2.9, alphaMultiplier: 0.085 },
  { scale: 2.5, alphaMultiplier: 0.12 },
  { scale: 2.15, alphaMultiplier: 0.16 },
  { scale: 1.8, alphaMultiplier: 0.22 },
  { scale: 1.48, alphaMultiplier: 0.3 },
] as const;

export function getLightingState(
  app: Application,
  worldTimeMinutes: number,
  animationMs: number,
  bloodMoon = false,
  harvestMoon = false,
) {
  const lighting = getTimeOfDayLighting(worldTimeMinutes, {
    bloodMoon,
    harvestMoon,
  });
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
  skyFill.rect(0, 0, app.screen.width, app.screen.height).fill(skyColor);
}

export function renderAtmosphere(
  app: Application,
  shaftGraphicsPool: GraphicsPool,
  celestialGraphicsPool: GraphicsPool,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  animationMs: number,
  sunPosition: { x: number; y: number },
  moonPosition: { x: number; y: number },
  focalPoint: { x: number; y: number },
  bloodMoon = false,
  harvestMoon = false,
) {
  if (lighting.shaftAlpha > 0.01) {
    renderLightShafts(
      app,
      shaftGraphicsPool,
      animationMs,
      sunPosition,
      focalPoint,
      0xfbbf24,
      lighting.shaftAlpha * lighting.sunShaftOpacity,
    );
    renderLightShafts(
      app,
      shaftGraphicsPool,
      animationMs,
      moonPosition,
      focalPoint,
      bloodMoon ? 0xff4d5d : harvestMoon ? 0x67e8f9 : 0xcbd5ff,
      lighting.shaftAlpha * lighting.moonShaftOpacity,
    );
  }

  renderCelestialBody(
    celestialGraphicsPool,
    moonPosition,
    scaleColor(
      bloodMoon ? 0xff5c6c : harvestMoon ? 0x67e8f9 : 0xdbeafe,
      lighting.ambientBrightness + (bloodMoon || harvestMoon ? 0.28 : 0.2),
    ),
    lighting.moonOpacity *
      lighting.celestialAlpha *
      (bloodMoon || harvestMoon ? 0.98 : 0.88),
    bloodMoon || harvestMoon ? 30 : 28,
  );
  renderCelestialBody(
    celestialGraphicsPool,
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
  overlayFill
    .rect(0, 0, app.screen.width, app.screen.height)
    .fill({ color, alpha });
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

  for (let index = 0; index < LIGHT_SHAFT_CONFIGS.length; index += 1) {
    const shaft = LIGHT_SHAFT_CONFIGS[index]!;
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
    beam
      .poly([
        sourcePosition.x - perpendicular.x * nearSpread,
        sourcePosition.y - perpendicular.y * nearSpread,
        sourcePosition.x + perpendicular.x * nearSpread,
        sourcePosition.y + perpendicular.y * nearSpread,
        focusPoint.x + perpendicular.x * spread,
        focusPoint.y + perpendicular.y * spread,
        focusPoint.x - perpendicular.x * spread,
        focusPoint.y - perpendicular.y * spread,
      ])
      .fill({ color: tint, alpha: opacity * shaft.alphaMultiplier });
  }
}

function renderCelestialBody(
  graphicsPool: GraphicsPool,
  position: { x: number; y: number },
  tint: number,
  alpha: number,
  radius: number,
) {
  if (alpha <= 0.01) return;

  for (let index = 0; index < CELESTIAL_HALO_LAYERS.length; index += 1) {
    const halo = CELESTIAL_HALO_LAYERS[index]!;
    const glow = takeGraphics(graphicsPool);
    glow
      .ellipse(position.x, position.y, radius * halo.scale, radius * halo.scale)
      .fill({ color: tint, alpha: alpha * halo.alphaMultiplier });
  }

  const glow = takeGraphics(graphicsPool);
  glow
    .ellipse(position.x, position.y, radius * 1.18, radius * 1.18)
    .fill({ color: tint, alpha: alpha * 0.34 });

  const body = takeGraphics(graphicsPool);
  body.ellipse(position.x, position.y, radius, radius).fill({
    color: tint,
    alpha,
  });
}

function smoothShadowSource(
  target: { x: number; y: number },
  animationMs: number,
) {
  if (smoothedShadowSource == null || lastShadowAnimationMs == null) {
    smoothedShadowSource = { x: target.x, y: target.y };
    lastShadowAnimationMs = animationMs;
    return smoothedShadowSource;
  }

  const deltaMs = Math.max(
    0,
    Math.min(1000, animationMs - lastShadowAnimationMs),
  );
  const progress = Math.min(1, deltaMs / 1000);
  smoothedShadowSource.x = lerp(smoothedShadowSource.x, target.x, progress);
  smoothedShadowSource.y = lerp(smoothedShadowSource.y, target.y, progress);
  lastShadowAnimationMs = animationMs;
  return smoothedShadowSource;
}
