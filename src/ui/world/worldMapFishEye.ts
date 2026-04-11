import { Filter } from 'pixi.js';
import { HEX_SIZE } from '../../app/constants';

const WORLD_MAP_FISHEYE_FRAGMENT = `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uAspect;
uniform float uStrength;
uniform float uFalloffPower;

vec2 mapToSource(vec2 uv) {
  vec2 delta = uv - uCenter;
  vec2 normalized = vec2(delta.x * uAspect, delta.y) / uRadius;
  float distance = length(normalized);

  if (distance >= 1.0) {
    return uv;
  }

  float magnification = 1.0 + uStrength * pow(max(0.0, 1.0 - distance * distance), uFalloffPower);
  vec2 warped = normalized / magnification;
  vec2 sourceDelta = vec2(warped.x / uAspect, warped.y) * uRadius;

  return uCenter + sourceDelta;
}

void main(void) {
  gl_FragColor = texture2D(uSampler, mapToSource(vTextureCoord));
}
`;

const WORLD_MAP_FISHEYE_STRENGTH = 0.3;
const WORLD_MAP_FISHEYE_FALLOFF_POWER = 0.6;
const WORLD_MAP_FISHEYE_RADIUS_IN_HEXES = 13;

export type WorldMapFishEyeFilter = Filter & {
  uniforms: {
    uCenter: Float32Array;
    uRadius: number;
    uAspect: number;
    uStrength: number;
    uFalloffPower: number;
  };
};

export function createWorldMapFishEyeFilter() {
  return new Filter(undefined, WORLD_MAP_FISHEYE_FRAGMENT, {
    uCenter: new Float32Array([0.5, 0.5]),
    uRadius: 0.25,
    uAspect: 1,
    uStrength: WORLD_MAP_FISHEYE_STRENGTH,
    uFalloffPower: WORLD_MAP_FISHEYE_FALLOFF_POWER,
  }) as WorldMapFishEyeFilter;
}

export function updateWorldMapFishEyeFilter(
  filter: WorldMapFishEyeFilter,
  screen: { width: number; height: number },
  center: { x: number; y: number },
) {
  const minDimension = Math.max(1, Math.min(screen.width, screen.height));
  const radiusPx = getWorldMapFishEyeRadiusPx(screen);
  filter.uniforms.uCenter[0] = center.x / Math.max(1, screen.width);
  filter.uniforms.uCenter[1] = center.y / Math.max(1, screen.height);
  filter.uniforms.uRadius = radiusPx / minDimension;
  filter.uniforms.uAspect = screen.width / Math.max(1, screen.height);
}

export function mapWorldMapFishEyeDisplayPointToSourcePoint(
  point: { x: number; y: number },
  screen: { width: number; height: number },
  center: { x: number; y: number },
) {
  const offset = { x: point.x - center.x, y: point.y - center.y };
  const mappedOffset = mapFishEyeOffsetToSource(offset, screen);
  return { x: center.x + mappedOffset.x, y: center.y + mappedOffset.y };
}

export function mapWorldMapFishEyeSourcePointToDisplayPoint(
  point: { x: number; y: number },
  screen: { width: number; height: number },
  center: { x: number; y: number },
) {
  const sourceOffset = { x: point.x - center.x, y: point.y - center.y };
  const sourceDistance = Math.hypot(sourceOffset.x, sourceOffset.y);
  if (sourceDistance === 0) {
    return point;
  }

  const radiusPx = getWorldMapFishEyeRadiusPx(screen);
  const aspect = screen.width / Math.max(1, screen.height);
  const sourceRadius = Math.hypot(sourceOffset.x * aspect, sourceOffset.y);

  if (sourceRadius >= radiusPx) {
    return point;
  }

  const maxScale = radiusPx / sourceRadius;
  let low = 1;
  let high = maxScale;

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const midScale = (low + high) / 2;
    const candidateOffset = {
      x: sourceOffset.x * midScale,
      y: sourceOffset.y * midScale,
    };
    const mapped = mapFishEyeOffsetToSource(candidateOffset, screen);
    const mappedDistance = Math.hypot(mapped.x, mapped.y);

    if (mappedDistance < sourceDistance) {
      low = midScale;
    } else {
      high = midScale;
    }
  }

  const displayScale = (low + high) / 2;
  return {
    x: center.x + sourceOffset.x * displayScale,
    y: center.y + sourceOffset.y * displayScale,
  };
}

function mapFishEyeOffsetToSource(
  offset: { x: number; y: number },
  screen: { width: number; height: number },
) {
  const radiusPx = getWorldMapFishEyeRadiusPx(screen);
  const aspect = screen.width / Math.max(1, screen.height);
  const normalized = {
    x: (offset.x * aspect) / radiusPx,
    y: offset.y / radiusPx,
  };
  const distance = Math.hypot(normalized.x, normalized.y);

  if (distance >= 1) {
    return offset;
  }

  const magnification =
    1 +
    WORLD_MAP_FISHEYE_STRENGTH *
      Math.pow(
        Math.max(0, 1 - distance * distance),
        WORLD_MAP_FISHEYE_FALLOFF_POWER,
      );

  return {
    x: offset.x / magnification,
    y: offset.y / magnification,
  };
}

function getWorldMapFishEyeRadiusPx(screen: { width: number; height: number }) {
  return Math.min(
    HEX_SIZE * WORLD_MAP_FISHEYE_RADIUS_IN_HEXES,
    Math.min(screen.width, screen.height) * 0.48,
  );
}
