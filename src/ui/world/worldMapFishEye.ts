import { Filter, GlProgram, UniformGroup } from 'pixi.js';
import { WORLD_RADIUS } from '../../game/config';
import { getWorldHexSize } from './renderSceneMath';

// Keep the fisheye implementation available, but disabled for now.
export const WORLD_MAP_FISHEYE_ENABLED = false;

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
const DEFAULT_FILTER_VERTEX = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

  return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
  return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
}
`;

const WORLD_MAP_FISHEYE_STRENGTH = 0.7;
const WORLD_MAP_FISHEYE_FALLOFF_POWER = 0.6;
const WORLD_MAP_FISHEYE_RADIUS_IN_HEXES = 13;

type WorldMapFishEyeUniformGroup = UniformGroup<{
  uCenter: { value: Float32Array; type: 'vec2<f32>' };
  uRadius: { value: number; type: 'f32' };
  uAspect: { value: number; type: 'f32' };
  uStrength: { value: number; type: 'f32' };
  uFalloffPower: { value: number; type: 'f32' };
}>;

export type WorldMapFishEyeFilter = Filter & {
  resources: Filter['resources'] & {
    worldMapFishEyeUniforms: WorldMapFishEyeUniformGroup;
  };
};

export function createWorldMapFishEyeFilter() {
  const worldMapFishEyeUniforms = new UniformGroup({
    uCenter: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
    uRadius: { value: 0.25, type: 'f32' },
    uAspect: { value: 1, type: 'f32' },
    uStrength: { value: WORLD_MAP_FISHEYE_STRENGTH, type: 'f32' },
    uFalloffPower: { value: WORLD_MAP_FISHEYE_FALLOFF_POWER, type: 'f32' },
  });

  return new Filter({
    glProgram: GlProgram.from({
      vertex: DEFAULT_FILTER_VERTEX,
      fragment: WORLD_MAP_FISHEYE_FRAGMENT,
      name: 'world-map-fisheye',
    }),
    resources: {
      worldMapFishEyeUniforms,
    },
  }) as WorldMapFishEyeFilter;
}

export function updateWorldMapFishEyeFilter(
  filter: WorldMapFishEyeFilter,
  screen: { width: number; height: number },
  center: { x: number; y: number },
) {
  const uniforms = filter.resources.worldMapFishEyeUniforms.uniforms;
  const minDimension = Math.max(1, Math.min(screen.width, screen.height));
  const radiusPx = getWorldMapFishEyeRadiusPx(screen);
  uniforms.uCenter[0] = center.x / Math.max(1, screen.width);
  uniforms.uCenter[1] = center.y / Math.max(1, screen.height);
  uniforms.uRadius = radiusPx / minDimension;
  uniforms.uAspect = screen.width / Math.max(1, screen.height);
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
  const hexSize = getWorldHexSize(screen, WORLD_RADIUS);
  return Math.min(
    hexSize * WORLD_MAP_FISHEYE_RADIUS_IN_HEXES,
    Math.min(screen.width, screen.height) * 0.48,
  );
}
