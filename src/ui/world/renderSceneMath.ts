import type { HexCoord } from '../../game/state';

const WORLD_MAP_WIDTH_PADDING = 0.94;
const WORLD_MAP_HEIGHT_PADDING = 0.9;

export function getWorldHexSize(
  viewport: { width: number; height: number },
  radius: number,
) {
  const diameter = radius * 2 + 1;
  const maxWidth = Math.max(1, viewport.width * WORLD_MAP_WIDTH_PADDING);
  const maxHeight = Math.max(1, viewport.height * WORLD_MAP_HEIGHT_PADDING);
  const widthLimitedSize = maxWidth / (Math.sqrt(3) * diameter);
  const heightLimitedSize = maxHeight / (radius * 3 + 2);

  return Math.max(1, Math.min(widthLimitedSize, heightLimitedSize));
}

export function tileToPoint(
  coord: HexCoord,
  originX: number,
  originY: number,
  size: number,
) {
  const x = size * Math.sqrt(3) * (coord.q + coord.r / 2) + originX;
  const y = size * 1.5 * coord.r + originY;
  return { x, y };
}

export function makeHex(x: number, y: number, size: number) {
  const points: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(x + size * Math.cos(angle), y + size * Math.sin(angle));
  }
  return points;
}

export function enemyOffsets(count: number) {
  const radius = count > 1 ? 14 : 0;
  return Array.from({ length: count }, (_, index) => {
    if (count === 1) return { x: 0, y: 0 };
    const angle =
      (-Math.PI / 2 + (Math.PI * 2 * index) / count) % (Math.PI * 2);
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    };
  });
}

export function getCelestialPosition(
  screenWidth: number,
  screenHeight: number,
  worldTimeMinutes: number,
) {
  const dayMinutes = 24 * 60;
  const progress =
    (((worldTimeMinutes % dayMinutes) + dayMinutes) % dayMinutes) / dayMinutes;
  const horizonStartX = screenWidth * 0.08;
  const horizonEndX = screenWidth * 0.92;
  const horizonY = screenHeight * 0.46;
  const apexHeight = screenHeight * 0.34;
  const x = horizonStartX + (horizonEndX - horizonStartX) * progress;
  const y = horizonY - Math.sin(progress * Math.PI) * apexHeight;
  return { x, y };
}

export function normalizeVector(vector: { x: number; y: number }) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

export function blendLightSources(
  sunPosition: { x: number; y: number },
  moonPosition: { x: number; y: number },
  sunOpacity: number,
  moonOpacity: number,
) {
  const totalOpacity = Math.max(0.0001, sunOpacity + moonOpacity);
  return {
    x:
      (sunPosition.x * sunOpacity + moonPosition.x * moonOpacity) /
      totalOpacity,
    y:
      (sunPosition.y * sunOpacity + moonPosition.y * moonOpacity) /
      totalOpacity,
  };
}

export function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}
