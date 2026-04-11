import { BLEND_MODES } from 'pixi.js';
import { createRng } from '../../game/random';
import { type GameState, type HexCoord } from '../../game/state';
import { HEX_SIZE } from '../../app/constants';
import { Icons } from '../icons';
import { scaleColor, type getTimeOfDayLighting } from './timeOfDay';
import { normalizeVector } from './renderSceneMath';
import {
  configureSprite,
  takeGraphics,
  takeSprite,
  type GraphicsPool,
  type SpritePool,
} from './renderScenePools';

export function renderCloudLayer(
  screen: { width: number; height: number },
  shadowPool: SpritePool,
  cloudPool: SpritePool,
  animationMs: number,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  worldSeed: string,
  shadowOffset: { x: number; y: number },
) {
  const cloudCount = 22;
  const weatherIcons = [Icons.SunCloud, Icons.Raining, Icons.Snowing];
  const clusterOffsets = [
    { x: -38, y: 12, scale: 0.72 },
    { x: -16, y: -6, scale: 0.9 },
    { x: 14, y: 6, scale: 1 },
    { x: 40, y: -8, scale: 0.82 },
  ];

  for (let index = 0; index < cloudCount; index += 1) {
    const rng = createRng(`${worldSeed}-cloud-${index}`);
    const scale = 0.88 + rng() * 0.68;
    const width = 92 * scale;
    const height = 92 * scale;
    const travelPadding = 180 + rng() * 220;
    const travel = screen.width + travelPadding + width * 2;
    const baseOffset = rng() * travel;
    const speed = 0.0048 + rng() * 0.0062;
    const progress = (animationMs * speed + baseOffset) % travel;
    const x = progress - width - travelPadding * 0.5;
    const yBase = screen.height * (0.05 + rng() * 0.56);
    const y =
      yBase +
      Math.sin(animationMs * (0.00024 + rng() * 0.0002) + rng() * Math.PI * 2) *
        (4 + rng() * 10);
    const icon = weatherIcons[Math.floor(rng() * weatherIcons.length)];
    const shadowOpacity = 0.1 + rng() * 0.06;
    const cloudOpacity = Math.max(
      0.24,
      0.34 + rng() * 0.12 + lighting.cloudAlphaBoost,
    );

    clusterOffsets.forEach((offset) => {
      const spriteWidth = width * offset.scale;
      const spriteHeight = height * offset.scale;

      const shadow = takeSprite(shadowPool, icon);
      configureSprite(
        shadow,
        scaleColor(0x020617, Math.max(0.8, lighting.ambientBrightness * 0.72)),
        spriteWidth * 1.05,
        spriteHeight * 1.05,
        shadowOpacity,
        {
          x: x + width * 0.5 + offset.x * scale + shadowOffset.x * 2.2,
          y: y + height * 0.5 + offset.y * scale + shadowOffset.y * 2.2,
        },
      );

      const shadowSoftener = takeSprite(shadowPool, icon);
      configureSprite(
        shadowSoftener,
        scaleColor(0x020617, Math.max(0.8, lighting.ambientBrightness * 0.68)),
        spriteWidth * 1.12,
        spriteHeight * 1.12,
        shadowOpacity * 0.45,
        {
          x: x + width * 0.5 + offset.x * scale + shadowOffset.x * 1.6,
          y: y + height * 0.5 + offset.y * scale + shadowOffset.y * 1.6,
        },
      );

      const cloud = takeSprite(cloudPool, icon);
      configureSprite(
        cloud,
        scaleColor(0xffffff, Math.max(0.82, lighting.ambientBrightness + 0.16)),
        spriteWidth,
        spriteHeight,
        cloudOpacity,
        {
          x: x + width * 0.5 + offset.x * scale,
          y: y + height * 0.5 + offset.y * scale,
        },
      );
    });
  }
}

export function renderTileGroundCover(
  spritePool: SpritePool,
  tile: GameState['tiles'][string],
  point: { x: number; y: number },
  ambientBrightness: number,
  worldSeed: string,
) {
  const groundCover = groundCoverStyle(tile.terrain);
  if (!groundCover) return;

  const rng = createRng(
    `${worldSeed}-ground-cover-${tile.coord.q},${tile.coord.r}-${tile.terrain}`,
  );
  if (rng() > 0.3) return;

  const grass = takeSprite(spritePool, Icons.HighGrass);
  configureSprite(
    grass,
    scaleColor(
      groundCover.tint,
      ambientBrightness + groundCover.brightnessBoost,
    ),
    groundCover.width,
    groundCover.height,
    groundCover.alpha,
    { x: point.x, y: point.y + HEX_SIZE * 0.42 + (rng() - 0.5) * 4 },
  );
}

export function renderEdgeWaterfall(
  graphicsPool: GraphicsPool,
  point: { x: number; y: number },
  relative: HexCoord,
  animationMs: number,
  ambientBrightness: number,
) {
  const flowDirection = normalizeVector({
    x: relative.q * 0.12,
    y: 1,
  });
  const perpendicular = { x: -flowDirection.y, y: flowDirection.x };
  const lip = {
    x: point.x + flowDirection.x * (HEX_SIZE * 0.7),
    y: point.y + flowDirection.y * (HEX_SIZE * 0.72),
  };
  const phase = animationMs * 0.0045;

  for (let index = 0; index < 3; index += 1) {
    const width = 12 - index * 2;
    const fallLength = 34 + ((phase + index * 0.9) % 1) * 42;
    const sprayLength = fallLength + 14 + index * 5;
    const alpha = 0.26 - index * 0.045;
    const tint = scaleColor(
      index === 0 ? 0x38bdf8 : 0x7dd3fc,
      ambientBrightness + 0.14,
    );
    const stream = takeGraphics(graphicsPool);
    stream.beginFill(tint, Math.max(0.08, alpha));
    stream.drawPolygon([
      lip.x - perpendicular.x * width,
      lip.y - perpendicular.y * width,
      lip.x + perpendicular.x * width,
      lip.y + perpendicular.y * width,
      lip.x + flowDirection.x * sprayLength + perpendicular.x * (width * 0.45),
      lip.y + flowDirection.y * sprayLength + perpendicular.y * (width * 0.45),
      lip.x + flowDirection.x * fallLength - perpendicular.x * (width * 0.45),
      lip.y + flowDirection.y * fallLength - perpendicular.y * (width * 0.45),
    ]);
    stream.endFill();
  }
}

export function renderCampfireLight(
  graphicsPool: GraphicsPool,
  point: { x: number; y: number },
  ambientBrightness: number,
  lighting: ReturnType<typeof getTimeOfDayLighting>,
  animationMs: number,
) {
  const nightGlow = Math.max(
    0,
    Math.min(1, lighting.moonOpacity * 0.78 + lighting.overlayAlpha - 0.24),
  );
  if (nightGlow <= 0.01) return;

  const flicker = 0.88 + Math.sin(animationMs * 0.008) * 0.08;
  const pulse = 0.94 + Math.sin(animationMs * 0.0035 + point.x * 0.01) * 0.06;
  const haloTint = scaleColor(0xfb923c, 0.84 + ambientBrightness * 0.38);
  const emberTint = scaleColor(0xfef08a, 0.8 + ambientBrightness * 0.24);
  const haloLayers = [
    { width: 4.05, height: 2.95, alpha: 0.024 },
    { width: 3.6, height: 2.58, alpha: 0.032 },
    { width: 3.1, height: 2.24, alpha: 0.044 },
    { width: 2.68, height: 1.92, alpha: 0.06 },
    { width: 2.18, height: 1.56, alpha: 0.084 },
    { width: 1.74, height: 1.22, alpha: 0.114 },
  ];

  haloLayers.forEach((layer, index) => {
    const glow = takeGraphics(graphicsPool);
    const scale = flicker + index * 0.03;
    glow.blendMode = BLEND_MODES.ADD;
    glow.beginFill(haloTint, layer.alpha * nightGlow * pulse);
    glow.drawEllipse(
      point.x,
      point.y + HEX_SIZE * 0.2,
      HEX_SIZE * layer.width * scale,
      HEX_SIZE * layer.height * scale,
    );
    glow.endFill();
  });

  const bloomLayers = [
    { width: 1.92, height: 1.18, alpha: 0.082, yOffset: 0.12 },
    { width: 1.46, height: 0.9, alpha: 0.114, yOffset: 0.08 },
    { width: 1.06, height: 0.64, alpha: 0.152, yOffset: 0.04 },
  ];
  bloomLayers.forEach((layer, index) => {
    const bloom = takeGraphics(graphicsPool);
    bloom.blendMode = BLEND_MODES.ADD;
    bloom.beginFill(emberTint, layer.alpha * nightGlow * (1 + flicker * 0.08));
    bloom.drawEllipse(
      point.x,
      point.y + HEX_SIZE * layer.yOffset - index,
      HEX_SIZE * layer.width,
      HEX_SIZE * layer.height,
    );
    bloom.endFill();
  });

  const heatWash = takeGraphics(graphicsPool);
  heatWash.blendMode = BLEND_MODES.ADD;
  heatWash.beginFill(haloTint, 0.12 * nightGlow);
  heatWash.drawEllipse(
    point.x,
    point.y + HEX_SIZE * 0.08,
    HEX_SIZE * 1.16,
    HEX_SIZE * 0.8,
  );
  heatWash.endFill();

  const emberCore = takeGraphics(graphicsPool);
  emberCore.blendMode = BLEND_MODES.ADD;
  emberCore.beginFill(emberTint, 0.22 * nightGlow * (1.02 + flicker * 0.08));
  emberCore.drawEllipse(
    point.x,
    point.y + HEX_SIZE * 0.1,
    HEX_SIZE * 0.46,
    HEX_SIZE * 0.3,
  );
  emberCore.endFill();
}

export function tileStyle(terrain: string) {
  switch (terrain) {
    case 'water':
      return { color: 0xdc2626, alpha: 0.34 };
    case 'mountain':
      return { color: 0xb91c1c, alpha: 0.36 };
    case 'forest':
      return { color: 0x166534, alpha: 1 };
    case 'swamp':
      return { color: 0x0f766e, alpha: 1 };
    case 'desert':
      return { color: 0xca8a04, alpha: 1 };
    default:
      return { color: 0x3f7d3f, alpha: 1 };
  }
}

function groundCoverStyle(terrain: string) {
  switch (terrain) {
    case 'plains':
      return {
        tint: 0x86efac,
        alpha: 0.34,
        width: 28,
        height: 28,
        brightnessBoost: 0.02,
      };
    case 'forest':
      return {
        tint: 0x4ade80,
        alpha: 0.28,
        width: 30,
        height: 30,
        brightnessBoost: -0.02,
      };
    case 'swamp':
      return {
        tint: 0x6ee7b7,
        alpha: 0.26,
        width: 28,
        height: 28,
        brightnessBoost: -0.04,
      };
    case 'desert':
      return {
        tint: 0xfde68a,
        alpha: 0.22,
        width: 24,
        height: 24,
        brightnessBoost: 0.05,
      };
    default:
      return null;
  }
}
