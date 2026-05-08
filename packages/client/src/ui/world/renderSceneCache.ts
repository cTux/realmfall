import {
  Container,
  Graphics,
  Rectangle,
  TextStyle,
  type Application,
} from 'pixi.js';
import { getAppliedInterfaceFontStack } from '../../app/interfaceFonts';
import type { CloudRenderInput } from './renderSceneEnvironment';
import { WorldIcons } from './worldIcons';
import type { VisibleTileRenderInput } from './renderSceneRenderInputs';
import {
  createGraphicsPool,
  createShadowedSprite,
  createShadowedSpritePool,
  createSpritePool,
  createTextPool,
  finishGraphicsPool,
  finishShadowedSpritePool,
  finishSpritePool,
  finishTextPool,
  resetGraphicsPool,
  resetShadowedSpritePool,
  resetSpritePool,
  resetTextPool,
  type GraphicsPool,
  type ShadowedSpriteEntry,
  type ShadowedSpritePool,
  type SpritePool,
  type TextPool,
} from './renderScenePools';
import {
  createWorldMapFishEyeFilter,
  WORLD_MAP_FISHEYE_ENABLED,
  type WorldMapFishEyeFilter,
} from './worldMapFishEyeRuntime';
import type { AnimatedWorldMarker } from './renderSceneMarkerAnimations';
import type { DungeonEnemyMovementTransition } from './renderSceneDungeonEnemyTransitions';
import type { VisibleWorldTile } from './visibleWorldTiles';

const SCENE_CACHE_KEY = Symbol('renderSceneCache');
const MAX_CLOUD_INPUT_CACHE_ENTRIES = 4;

export const ENEMY_LEVEL_LABEL_STYLE = new TextStyle({
  fill: 0xffffff,
  fontSize: 11,
  fontWeight: '800',
});

export const ENEMY_GROUP_LABEL_STYLE = new TextStyle({
  fill: 0xef4444,
  fontSize: 12,
  fontWeight: '800',
  stroke: {
    color: 0x020617,
    width: 2,
    join: 'round',
  },
});

type CachedApplication = Application & { [SCENE_CACHE_KEY]?: SceneCache };

const enemyLevelLabelStylesByFont = new Map<string, TextStyle>();

export interface SceneCache {
  skyFill: Graphics;
  overlayFill: Graphics;
  fullscreenEffectFill: Graphics;
  worldMap: Container;
  world: Container;
  worldGround: Container;
  worldStaticDetail: Container;
  worldInteraction: Container;
  worldBorders: Container;
  worldAnimatedDetail: Container;
  worldMarkers: Container;
  worldMarkerBadges: Container;
  worldPlayer: Container;
  waterfalls: Container;
  labels: Container;
  worldMapFilterArea: Rectangle;
  worldMapFilter: WorldMapFishEyeFilter;
  atmosphereShaftGraphics: GraphicsPool;
  atmosphereCelestialGraphics: GraphicsPool;
  worldGroundGraphics: GraphicsPool;
  worldTerrainSprites: SpritePool;
  worldStaticDetailGraphics: GraphicsPool;
  worldBorderGraphics: GraphicsPool;
  worldInteractionGraphics: GraphicsPool;
  worldAnimatedDetailGraphics: GraphicsPool;
  waterfallGraphics: GraphicsPool;
  labelTexts: TextPool;
  worldStaticDetailSprites: SpritePool;
  worldStaticMarkerSprites: ShadowedSpritePool;
  worldStaticMarkerBadgeGraphics: GraphicsPool;
  worldStaticMarkerTexts: TextPool;
  worldAnimatedMarkerBadgeGraphics: GraphicsPool;
  playerResourceGraphics: GraphicsPool;
  playerCooldownGraphics: GraphicsPool;
  cloudShadowSprites: SpritePool;
  cloudSprites: SpritePool;
  cloudInputsBySeed: Map<string, CloudRenderInput[]>;
  campfireLightPoints: Array<{ alpha: number; x: number; y: number }>;
  animatedWorldMarkers: AnimatedWorldMarker[];
  dungeonEnemyMovementTransitionsByEnemyId: Map<
    string,
    DungeonEnemyMovementTransition
  >;
  dungeonEnemyLastCoordsById: Map<string, { q: number; r: number }>;
  dungeonEnemyTransitionWorldId: string | null;
  player: ShadowedSpriteEntry;
  derivedRenderVisibleTilesSource: VisibleWorldTile[] | null;
  derivedRenderEnemiesSource: Record<string, unknown> | null;
  derivedRenderVisibleTileInputs: VisibleTileRenderInput[] | null;
  derivedRenderVisibleEnemyToken: number | null;
  derivedRenderPlayerCoordKey: string | null;
  derivedRenderHomeHexKey: string | null;
  derivedRenderBloodMoonActive: boolean | null;
  derivedRenderInterfaceFontStack: string | null;
  derivedRenderIconTextureVersion: number | null;
  derivedStaticRenderToken: number | null;
  derivedInteractionRenderToken: number | null;
  staticRenderToken: number | null;
  visibleEnemyBadgeRenderToken: number | null;
  interactionRenderToken: number | null;
  playerResourceRenderToken: string | null;
  animatedRenderToken: string | null;
  renderCounts: SceneRenderCounts;
  screenWidth: number;
  screenHeight: number;
}

export interface SceneRenderCounts {
  total: number;
  static: number;
  interaction: number;
  animated: number;
}

export function getSceneCache(app: Application) {
  const cachedApp = app as CachedApplication;
  if (cachedApp[SCENE_CACHE_KEY]) return cachedApp[SCENE_CACHE_KEY];

  const sky = new Container();
  const worldMap = new Container();
  const world = new Container();
  const worldGround = new Container();
  const worldGroundFill = new Container();
  const worldTerrain = new Container();
  const worldStaticDetail = new Container();
  const worldInteraction = new Container();
  const worldBorders = new Container();
  const worldMarkers = new Container();
  const worldMarkerBadges = new Container();
  const worldAnimatedDetail = new Container();
  const worldPlayer = new Container();
  const playerResources = new Container();
  const playerCooldown = new Container();
  const waterfalls = new Container();
  const labels = new Container();
  const atmosphereShafts = new Container();
  const atmosphereCelestials = new Container();
  const cloudShadows = new Container();
  const clouds = new Container();
  const overlay = new Container();

  const worldMapFilterArea = WORLD_MAP_FISHEYE_ENABLED
    ? new Rectangle(0, 0, app.screen.width, app.screen.height)
    : new Rectangle(0, 0, 0, 0);
  const worldMapFilter = createWorldMapFishEyeFilter();
  if (WORLD_MAP_FISHEYE_ENABLED && worldMapFilter) {
    worldMap.filters = [worldMapFilter];
    worldMap.filterArea = worldMapFilterArea;
  }

  worldGround.addChild(worldGroundFill, worldTerrain);
  world.addChild(
    worldGround,
    worldStaticDetail,
    worldInteraction,
    worldBorders,
    worldAnimatedDetail,
    worldMarkers,
    worldMarkerBadges,
    worldPlayer,
  );
  worldMap.addChild(world, waterfalls, labels);
  app.stage.addChild(
    sky,
    worldMap,
    atmosphereShafts,
    atmosphereCelestials,
    cloudShadows,
    clouds,
    overlay,
  );

  const skyFill = new Graphics();
  sky.addChild(skyFill);

  const overlayFill = new Graphics();
  const fullscreenEffectFill = new Graphics();
  overlay.addChild(overlayFill, fullscreenEffectFill);

  const player = createShadowedSprite(WorldIcons.Player);
  worldPlayer.addChild(playerResources, playerCooldown, player.wrapper);

  const scene: SceneCache = {
    skyFill,
    overlayFill,
    fullscreenEffectFill,
    worldMap,
    world,
    worldGround,
    worldStaticDetail,
    worldInteraction,
    worldBorders,
    worldAnimatedDetail,
    worldMarkers,
    worldMarkerBadges,
    worldPlayer,
    waterfalls,
    labels,
    worldMapFilterArea,
    worldMapFilter,
    atmosphereShaftGraphics: createGraphicsPool(atmosphereShafts),
    atmosphereCelestialGraphics: createGraphicsPool(atmosphereCelestials),
    worldGroundGraphics: createGraphicsPool(worldGroundFill),
    worldTerrainSprites: createSpritePool(worldTerrain),
    worldStaticDetailGraphics: createGraphicsPool(worldStaticDetail),
    worldBorderGraphics: createGraphicsPool(worldBorders),
    worldInteractionGraphics: createGraphicsPool(worldInteraction),
    worldAnimatedDetailGraphics: createGraphicsPool(worldAnimatedDetail),
    waterfallGraphics: createGraphicsPool(waterfalls),
    labelTexts: createTextPool(labels),
    worldStaticDetailSprites: createSpritePool(worldStaticDetail),
    worldStaticMarkerSprites: createShadowedSpritePool(worldMarkers),
    worldStaticMarkerBadgeGraphics: createGraphicsPool(worldMarkerBadges),
    worldStaticMarkerTexts: createTextPool(worldMarkerBadges),
    worldAnimatedMarkerBadgeGraphics: createGraphicsPool(worldMarkerBadges),
    playerResourceGraphics: createGraphicsPool(playerResources),
    playerCooldownGraphics: createGraphicsPool(playerCooldown),
    cloudShadowSprites: createSpritePool(cloudShadows),
    cloudSprites: createSpritePool(clouds),
    cloudInputsBySeed: new Map(),
    campfireLightPoints: [],
    animatedWorldMarkers: [],
    dungeonEnemyMovementTransitionsByEnemyId: new Map(),
    dungeonEnemyLastCoordsById: new Map(),
    dungeonEnemyTransitionWorldId: null,
    player,
    derivedRenderVisibleTilesSource: null,
    derivedRenderEnemiesSource: null,
    derivedRenderVisibleTileInputs: null,
    derivedRenderVisibleEnemyToken: null,
    derivedRenderPlayerCoordKey: null,
    derivedRenderHomeHexKey: null,
    derivedRenderBloodMoonActive: null,
    derivedRenderInterfaceFontStack: null,
    derivedRenderIconTextureVersion: null,
    derivedStaticRenderToken: null,
    derivedInteractionRenderToken: null,
    staticRenderToken: null,
    visibleEnemyBadgeRenderToken: null,
    interactionRenderToken: null,
    playerResourceRenderToken: null,
    animatedRenderToken: null,
    renderCounts: createEmptySceneRenderCounts(),
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
  };

  cachedApp[SCENE_CACHE_KEY] = scene;
  return scene;
}

export function applyWorldSceneOffset(
  scene: SceneCache,
  offset: { x: number; y: number },
) {
  [
    scene.worldGround,
    scene.worldStaticDetail,
    scene.worldInteraction,
    scene.worldBorders,
    scene.worldAnimatedDetail,
    scene.worldMarkers,
    scene.worldMarkerBadges,
    scene.waterfalls,
    scene.labels,
  ].forEach((container) => {
    container.position.set(offset.x, offset.y);
  });

  scene.worldPlayer.position.set(0, 0);
}

function createEmptySceneRenderCounts(): SceneRenderCounts {
  return {
    total: 0,
    static: 0,
    interaction: 0,
    animated: 0,
  };
}

export function getSceneRenderCounts(app: Application): SceneRenderCounts {
  return { ...getSceneCache(app).renderCounts };
}

export function resetSceneRenderCounts(app: Application) {
  getSceneCache(app).renderCounts = createEmptySceneRenderCounts();
}

export function beginAnimatedSceneRender(scene: SceneCache) {
  scene.renderCounts.animated += 1;
  resetGraphicsPool(scene.atmosphereShaftGraphics);
  resetGraphicsPool(scene.atmosphereCelestialGraphics);
  resetGraphicsPool(scene.worldAnimatedDetailGraphics);
  resetGraphicsPool(scene.worldAnimatedMarkerBadgeGraphics);
  resetGraphicsPool(scene.playerCooldownGraphics);
  resetGraphicsPool(scene.waterfallGraphics);
  resetTextPool(scene.labelTexts);
  resetSpritePool(scene.cloudShadowSprites);
  resetSpritePool(scene.cloudSprites);
}

export function completeAnimatedSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.atmosphereShaftGraphics);
  finishGraphicsPool(scene.atmosphereCelestialGraphics);
  finishGraphicsPool(scene.worldAnimatedDetailGraphics);
  finishGraphicsPool(scene.worldAnimatedMarkerBadgeGraphics);
  finishGraphicsPool(scene.playerCooldownGraphics);
  finishGraphicsPool(scene.waterfallGraphics);
  finishTextPool(scene.labelTexts);
  finishSpritePool(scene.cloudShadowSprites);
  finishSpritePool(scene.cloudSprites);
}

export function beginStaticSceneRender(scene: SceneCache) {
  scene.renderCounts.static += 1;
  resetGraphicsPool(scene.worldGroundGraphics);
  resetSpritePool(scene.worldTerrainSprites);
  resetGraphicsPool(scene.worldStaticDetailGraphics);
  resetGraphicsPool(scene.worldBorderGraphics);
  resetSpritePool(scene.worldStaticDetailSprites);
  resetShadowedSpritePool(scene.worldStaticMarkerSprites);
  resetGraphicsPool(scene.worldStaticMarkerBadgeGraphics);
  resetTextPool(scene.worldStaticMarkerTexts);
  scene.animatedWorldMarkers.length = 0;
}

export function completeStaticSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.worldGroundGraphics);
  finishSpritePool(scene.worldTerrainSprites);
  finishGraphicsPool(scene.worldStaticDetailGraphics);
  finishGraphicsPool(scene.worldBorderGraphics);
  finishSpritePool(scene.worldStaticDetailSprites);
  finishShadowedSpritePool(scene.worldStaticMarkerSprites);
  finishGraphicsPool(scene.worldStaticMarkerBadgeGraphics);
  finishTextPool(scene.worldStaticMarkerTexts);
}

export function beginInteractionSceneRender(scene: SceneCache) {
  scene.renderCounts.interaction += 1;
  resetGraphicsPool(scene.worldInteractionGraphics);
  resetGraphicsPool(scene.playerResourceGraphics);
}

export function completeInteractionSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.worldInteractionGraphics);
  finishGraphicsPool(scene.playerResourceGraphics);
}

export function getCachedValue<K, V>(cache: Map<K, V>, key: K) {
  const value = cache.get(key);
  if (value === undefined) {
    return null;
  }

  cache.delete(key);
  cache.set(key, value);
  return value;
}

export function getEnemyLevelLabelStyle() {
  const fontFamily = getAppliedInterfaceFontStack();
  const cachedStyle = enemyLevelLabelStylesByFont.get(fontFamily);
  if (cachedStyle) {
    return cachedStyle;
  }

  const style = new TextStyle({
    fill: 0xffffff,
    fontFamily,
    fontSize: 11,
    fontWeight: '800',
  });
  enemyLevelLabelStylesByFont.set(fontFamily, style);
  return style;
}

export function setBoundedCachedValue<K, V>(
  cache: Map<K, V>,
  key: K,
  value: V,
  maxEntries: number,
) {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, value);

  if (cache.size <= maxEntries) {
    return value;
  }

  const oldestKey = cache.keys().next().value;
  if (oldestKey !== undefined) {
    cache.delete(oldestKey);
  }

  return value;
}

export const SCENE_CACHE_LIMITS = {
  cloudInputsBySeed: MAX_CLOUD_INPUT_CACHE_ENTRIES,
} as const;
