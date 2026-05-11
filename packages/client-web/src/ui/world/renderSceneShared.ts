import { GAME_TAGS } from '@realmfall/core/game/content/tags';
import type {
  HexCoord,
  Tile,
  WorldKind,
} from '@realmfall/core/game/stateTypes';
import { getStructureConfig } from '@realmfall/core/game/stateSelectors';
import { CLIENT_WORLD_RENDER_SETTINGS } from '../../client.config';
import { WORLD_RENDER_COLORS } from '../../theme.config';
import type { SceneCache } from './renderSceneCache';
import {
  getCachedValue,
  SCENE_CACHE_LIMITS,
  setBoundedCachedValue,
} from './renderSceneCache';
import { buildCloudRenderInputs } from './renderSceneEnvironment';
import { ENTITY_BADGE_BACKGROUND_COLORS } from './renderSceneEntityBadge';
import {
  createAnimatedWorldMarker,
  type AnimatedWorldMarkerMovementTransition,
  type WorldMarkerAnimationKind,
} from './renderSceneMarkerAnimations';
import { makeHex, type tileToPoint } from './renderSceneMath';
import { type ShadowedSpriteEntry } from './renderScenePools';
import { ANIMATED_LAYER_FRAME_MS } from './renderCadence';
export { WORLD_MAP_CLOUD_PARALLAX_FACTOR } from './worldMapCamera';
export { ANIMATED_LAYER_FPS, ANIMATED_LAYER_FRAME_MS } from './renderCadence';

export const HOME_HEX_TINT_COLOR = WORLD_RENDER_COLORS.homeHexTint;
export const HOME_HEX_TINT_ALPHA =
  CLIENT_WORLD_RENDER_SETTINGS.homeHexTintAlpha;
export const SAFE_PATH_TINT_COLOR = WORLD_RENDER_COLORS.safePathTint;
export const SAFE_PATH_TINT_ALPHA =
  CLIENT_WORLD_RENDER_SETTINGS.safePathTintAlpha;
export const QUEUED_PATH_TINT_COLOR = WORLD_RENDER_COLORS.queuedPathTint;
export const QUEUED_PATH_TINT_ALPHA =
  CLIENT_WORLD_RENDER_SETTINGS.queuedPathTintAlpha;
export const SAFE_PATH_HEX_INSET =
  CLIENT_WORLD_RENDER_SETTINGS.safePathHexInset;
export const HOME_HEX_TINT_INSET =
  CLIENT_WORLD_RENDER_SETTINGS.homeHexTintInset;
export const STRUCTURE_HEX_ICON_TINT = WORLD_RENDER_COLORS.structureHexIconTint;
export const WORLD_BOSS_HEX_TINT_COLOR = WORLD_RENDER_COLORS.worldBossHexTint;
export const WORLD_BOSS_HEX_TINT_ALPHA =
  CLIENT_WORLD_RENDER_SETTINGS.worldBossHexTintAlpha;
export const ZERO_SHADOW_OFFSET = { x: 0, y: 0 };
export const ENEMY_GROUP_BADGE_OFFSET = { x: 13, y: 11 };

export function getCloudRenderInputs(
  scene: SceneCache,
  cacheKey: string,
  worldKind: WorldKind,
) {
  let cloudInputs = getCachedValue(scene.cloudInputsBySeed, cacheKey);
  if (!cloudInputs) {
    cloudInputs = buildCloudRenderInputs(cacheKey, worldKind);
    setBoundedCachedValue(
      scene.cloudInputsBySeed,
      cacheKey,
      cloudInputs,
      SCENE_CACHE_LIMITS.cloudInputsBySeed,
    );
  }

  return cloudInputs;
}

export function registerAnimatedWorldMarker(
  scene: SceneCache,
  seed: string,
  coord: HexCoord,
  entry: ShadowedSpriteEntry,
  point: { x: number; y: number },
  width: number,
  height: number,
  tint: number,
  kind: WorldMarkerAnimationKind,
  alpha = 1,
  options?: {
    animationKey?: string;
    enemyId?: string;
    movementTransition?: AnimatedWorldMarkerMovementTransition;
  },
) {
  scene.animatedWorldMarkers.push(
    createAnimatedWorldMarker({
      alpha,
      animationKey: options?.animationKey,
      coord,
      enemyId: options?.enemyId,
      entry,
      height,
      kind,
      movementTransition: options?.movementTransition,
      point,
      seed,
      tint,
      width,
    }),
  );
}

export function getAnimatedRenderToken(
  state: {
    activeWorldId: string;
    seed: string;
    bloodMoonActive: boolean;
    harvestMoonActive: boolean;
  },
  animationMs: number,
  fullscreenVisualEffectToken: string,
  frameMs = ANIMATED_LAYER_FRAME_MS,
) {
  return [
    state.seed,
    state.activeWorldId,
    state.bloodMoonActive ? 'blood' : 'normal',
    state.harvestMoonActive ? 'harvest' : 'default',
    fullscreenVisualEffectToken,
    Math.floor(animationMs / frameMs),
  ].join(':');
}

export function makeInsetHex(
  point: ReturnType<typeof tileToPoint>,
  size: number,
  inset: number,
) {
  return makeHex(point.x, point.y, Math.max(1, size - inset));
}

export function getStructureHexIconTint(structure: Tile['structure']) {
  if (
    structure &&
    getStructureConfig(structure).tags?.includes(GAME_TAGS.structure.ore)
  ) {
    return getStructureConfig(structure).tint;
  }

  return STRUCTURE_HEX_ICON_TINT;
}

export function getStructureBadgeBackgroundColor(structure: Tile['structure']) {
  if (structure && getStructureConfig(structure).gathering) {
    return ENTITY_BADGE_BACKGROUND_COLORS.default;
  }

  return ENTITY_BADGE_BACKGROUND_COLORS.structure;
}

export function structureEmitsCampfireLight(structure: Tile['structure']) {
  if (!structure) {
    return false;
  }

  const { functionsProvided } = getStructureConfig(structure);
  return (
    functionsProvided.includes('cook') || functionsProvided.includes('smelt')
  );
}
