import {
  Container,
  Graphics,
  Rectangle,
  TextStyle,
  type Application,
} from 'pixi.js';
import type { GameState, HexCoord, getVisibleTiles } from '../../game/state';
import type {
  CloudRenderInput,
  TileGroundCoverPresentation,
} from './renderSceneEnvironment';
import { WorldIcons } from './worldIcons';
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
} from './worldMapFishEye';

const SCENE_CACHE_KEY = Symbol('renderSceneCache');

export const ENEMY_LEVEL_LABEL_STYLE = new TextStyle({
  fill: 0xfef2f2,
  fontSize: 12,
  fontWeight: '700',
});

export const ENEMY_GROUP_LABEL_STYLE = new TextStyle({
  fill: 0xfef3c7,
  fontSize: 11,
  fontWeight: '700',
});

type CachedApplication = Application & { [SCENE_CACHE_KEY]?: SceneCache };

export interface SceneCache {
  skyFill: Graphics;
  overlayFill: Graphics;
  worldMap: Container;
  world: Container;
  waterfalls: Container;
  labels: Container;
  worldMapFilterArea: Rectangle;
  worldMapFilter: WorldMapFishEyeFilter;
  atmosphereShaftGraphics: GraphicsPool;
  atmosphereCelestialGraphics: GraphicsPool;
  worldGroundGraphics: GraphicsPool;
  worldStaticDetailGraphics: GraphicsPool;
  worldInteractionGraphics: GraphicsPool;
  worldAnimatedDetailGraphics: GraphicsPool;
  waterfallGraphics: GraphicsPool;
  labelTexts: TextPool;
  worldStaticDetailSprites: SpritePool;
  worldStaticMarkerSprites: ShadowedSpritePool;
  cloudShadowSprites: SpritePool;
  cloudSprites: SpritePool;
  cloudInputsBySeed: Map<string, CloudRenderInput[]>;
  tileGroundCoverPresentationByKey: Map<string, TileGroundCoverPresentation>;
  player: ShadowedSpriteEntry;
  staticState: GameState | null;
  staticVisibleTiles: ReturnType<typeof getVisibleTiles> | null;
  staticWorldTimeMinutes: number | null;
  interactionState: GameState | null;
  interactionVisibleTiles: ReturnType<typeof getVisibleTiles> | null;
  interactionWorldTimeMinutes: number | null;
  interactionSelected: HexCoord | null;
  interactionHoveredMove: HexCoord | null;
  screenWidth: number;
  screenHeight: number;
}

export function getSceneCache(app: Application) {
  const cachedApp = app as CachedApplication;
  if (cachedApp[SCENE_CACHE_KEY]) return cachedApp[SCENE_CACHE_KEY];

  const sky = new Container();
  const worldMap = new Container();
  const world = new Container();
  const worldGround = new Container();
  const worldStaticDetail = new Container();
  const worldInteraction = new Container();
  const worldMarkers = new Container();
  const worldAnimatedDetail = new Container();
  const worldPlayer = new Container();
  const waterfalls = new Container();
  const labels = new Container();
  const atmosphereShafts = new Container();
  const atmosphereCelestials = new Container();
  const cloudShadows = new Container();
  const clouds = new Container();
  const overlay = new Container();

  const worldMapFilterArea = new Rectangle(
    0,
    0,
    app.screen.width,
    app.screen.height,
  );
  const worldMapFilter = createWorldMapFishEyeFilter();
  if (WORLD_MAP_FISHEYE_ENABLED) {
    worldMap.filters = [worldMapFilter];
    worldMap.filterArea = worldMapFilterArea;
  }

  world.addChild(
    worldGround,
    worldStaticDetail,
    worldInteraction,
    worldMarkers,
    worldAnimatedDetail,
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
  overlay.addChild(overlayFill);

  const player = createShadowedSprite(WorldIcons.Player);
  worldPlayer.addChild(player.wrapper);

  const scene: SceneCache = {
    skyFill,
    overlayFill,
    worldMap,
    world,
    waterfalls,
    labels,
    worldMapFilterArea,
    worldMapFilter,
    atmosphereShaftGraphics: createGraphicsPool(atmosphereShafts),
    atmosphereCelestialGraphics: createGraphicsPool(atmosphereCelestials),
    worldGroundGraphics: createGraphicsPool(worldGround),
    worldStaticDetailGraphics: createGraphicsPool(worldStaticDetail),
    worldInteractionGraphics: createGraphicsPool(worldInteraction),
    worldAnimatedDetailGraphics: createGraphicsPool(worldAnimatedDetail),
    waterfallGraphics: createGraphicsPool(waterfalls),
    labelTexts: createTextPool(labels),
    worldStaticDetailSprites: createSpritePool(worldStaticDetail),
    worldStaticMarkerSprites: createShadowedSpritePool(worldMarkers),
    cloudShadowSprites: createSpritePool(cloudShadows),
    cloudSprites: createSpritePool(clouds),
    cloudInputsBySeed: new Map(),
    tileGroundCoverPresentationByKey: new Map(),
    player,
    staticState: null,
    staticVisibleTiles: null,
    staticWorldTimeMinutes: null,
    interactionState: null,
    interactionVisibleTiles: null,
    interactionWorldTimeMinutes: null,
    interactionSelected: null,
    interactionHoveredMove: null,
    screenWidth: app.screen.width,
    screenHeight: app.screen.height,
  };

  cachedApp[SCENE_CACHE_KEY] = scene;
  return scene;
}

export function beginAnimatedSceneRender(scene: SceneCache) {
  resetGraphicsPool(scene.atmosphereShaftGraphics);
  resetGraphicsPool(scene.atmosphereCelestialGraphics);
  resetGraphicsPool(scene.worldAnimatedDetailGraphics);
  resetGraphicsPool(scene.waterfallGraphics);
  resetTextPool(scene.labelTexts);
  resetSpritePool(scene.cloudShadowSprites);
  resetSpritePool(scene.cloudSprites);
}

export function completeAnimatedSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.atmosphereShaftGraphics);
  finishGraphicsPool(scene.atmosphereCelestialGraphics);
  finishGraphicsPool(scene.worldAnimatedDetailGraphics);
  finishGraphicsPool(scene.waterfallGraphics);
  finishTextPool(scene.labelTexts);
  finishSpritePool(scene.cloudShadowSprites);
  finishSpritePool(scene.cloudSprites);
}

export function beginStaticSceneRender(scene: SceneCache) {
  resetGraphicsPool(scene.worldGroundGraphics);
  resetGraphicsPool(scene.worldStaticDetailGraphics);
  resetSpritePool(scene.worldStaticDetailSprites);
  resetShadowedSpritePool(scene.worldStaticMarkerSprites);
}

export function completeStaticSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.worldGroundGraphics);
  finishGraphicsPool(scene.worldStaticDetailGraphics);
  finishSpritePool(scene.worldStaticDetailSprites);
  finishShadowedSpritePool(scene.worldStaticMarkerSprites);
}

export function beginInteractionSceneRender(scene: SceneCache) {
  resetGraphicsPool(scene.worldInteractionGraphics);
}

export function completeInteractionSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.worldInteractionGraphics);
}
