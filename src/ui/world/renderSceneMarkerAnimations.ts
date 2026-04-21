import { hexKey } from '../../game/hex';
import { createRng } from '../../game/random';
import type { HexCoord } from '../../game/state';
import { scaleColor } from './timeOfDay';
import type { ShadowedSpriteEntry } from './renderScenePools';

export type WorldMarkerAnimationKind =
  | 'enemy'
  | 'worldBoss'
  | 'settlement'
  | 'utility'
  | 'dungeon'
  | 'resource';

interface AnimatedWorldMarkerOptions {
  alpha: number;
  coord: HexCoord;
  entry: ShadowedSpriteEntry;
  height: number;
  kind: WorldMarkerAnimationKind;
  point: { x: number; y: number };
  seed: string;
  tint: number;
  width: number;
}

interface WorldMarkerLightingState {
  ambientBrightness: number;
  moonOpacity: number;
  overlayAlpha: number;
}

export interface AnimatedWorldMarker {
  baseAlpha: number;
  baseHeight: number;
  basePoint: { x: number; y: number };
  baseTint: number;
  baseWidth: number;
  entry: ShadowedSpriteEntry;
  kind: WorldMarkerAnimationKind;
  phase: number;
  secondaryPhase: number;
  timeScale: number;
}

export function createAnimatedWorldMarker({
  alpha,
  coord,
  entry,
  height,
  kind,
  point,
  seed,
  tint,
  width,
}: AnimatedWorldMarkerOptions): AnimatedWorldMarker {
  const rng = createRng(`${seed}:${hexKey(coord)}:${kind}`);
  return {
    baseAlpha: alpha,
    baseHeight: height,
    basePoint: { ...point },
    baseTint: tint,
    baseWidth: width,
    entry,
    kind,
    phase: rng() * Math.PI * 2,
    secondaryPhase: rng() * Math.PI * 2,
    timeScale: 0.86 + rng() * 0.32,
  };
}

export function animateWorldMarkers(
  markers: AnimatedWorldMarker[],
  animationMs: number,
  lighting: WorldMarkerLightingState,
) {
  markers.forEach((marker) =>
    animateWorldMarker(marker, animationMs * marker.timeScale, lighting),
  );
}

function animateWorldMarker(
  marker: AnimatedWorldMarker,
  animationMs: number,
  lighting: WorldMarkerLightingState,
) {
  const wave = Math.sin(animationMs * 0.0044 + marker.phase);
  const secondaryWave = Math.sin(animationMs * 0.0031 + marker.secondaryPhase);
  const nightGlow = Math.max(
    0,
    lighting.moonOpacity * 0.74 + lighting.overlayAlpha - 0.16,
  );

  let alpha = marker.baseAlpha;
  let rotation = 0;
  let scale = 1;
  let tint = marker.baseTint;
  let yOffset = 0;

  switch (marker.kind) {
    case 'enemy':
      yOffset = wave * 1.6;
      scale = 1 + secondaryWave * 0.028;
      break;
    case 'worldBoss': {
      const menace = (wave + 1) * 0.5;
      yOffset = secondaryWave * 2.8;
      scale = 1 + menace * 0.09;
      break;
    }
    case 'settlement':
      yOffset = wave * 1.15;
      scale = 1 + secondaryWave * 0.018;
      rotation = secondaryWave * 0.01;
      break;
    case 'utility': {
      const glow = (wave + 1) * 0.5;
      yOffset = secondaryWave * 1.5;
      scale = 1 + glow * (0.018 + nightGlow * 0.04);
      tint = mixColor(
        marker.baseTint,
        0xfb923c,
        nightGlow * (0.14 + glow * 0.2),
      );
      break;
    }
    case 'dungeon': {
      const threat = (wave + 1) * 0.5;
      yOffset = secondaryWave * 1.45;
      scale = 1 + threat * 0.06;
      tint = mixColor(marker.baseTint, 0xa855f7, 0.14 + threat * 0.2);
      alpha = marker.baseAlpha * (0.94 + threat * 0.08);
      break;
    }
    case 'resource': {
      const sparkle = Math.max(
        0,
        Math.sin(animationMs * 0.0018 + marker.phase),
      );
      const glint = sparkle ** 10;
      scale = 1 + glint * 0.045;
      alpha = Math.min(1, marker.baseAlpha + glint * 0.12);
      tint =
        marker.baseTint === 0xffffff
          ? mixColor(marker.baseTint, 0xfef3c7, glint * 0.3)
          : scaleColor(marker.baseTint, 1 + glint * 0.28);
      break;
    }
  }

  marker.entry.wrapper.position.set(
    marker.basePoint.x,
    marker.basePoint.y + yOffset,
  );
  marker.entry.wrapper.scale.set(scale, scale);
  marker.entry.wrapper.rotation = rotation;
  marker.entry.wrapper.alpha = alpha;
  marker.entry.sprite.tint = tint;
  marker.entry.sprite.width = marker.baseWidth;
  marker.entry.sprite.height = marker.baseHeight;
}

function mixColor(left: number, right: number, amount: number) {
  const progress = Math.max(0, Math.min(1, amount));
  const red = mixColorChannel(
    (left >> 16) & 0xff,
    (right >> 16) & 0xff,
    progress,
  );
  const green = mixColorChannel(
    (left >> 8) & 0xff,
    (right >> 8) & 0xff,
    progress,
  );
  const blue = mixColorChannel(left & 0xff, right & 0xff, progress);
  return (red << 16) | (green << 8) | blue;
}

function mixColorChannel(left: number, right: number, amount: number) {
  return Math.round(left + (right - left) * amount);
}
