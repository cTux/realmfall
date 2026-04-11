import {
  Container,
  Graphics,
  Rectangle,
  TextStyle,
  type Application,
} from 'pixi.js';
import { Icons } from '../icons';
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
  world: Container;
  waterfalls: Container;
  labels: Container;
  worldMapFilterArea: Rectangle;
  worldMapFilters: WorldMapFishEyeFilter[];
  atmosphereShaftGraphics: GraphicsPool;
  atmosphereCelestialGraphics: GraphicsPool;
  worldGroundGraphics: GraphicsPool;
  worldDetailGraphics: GraphicsPool;
  waterfallGraphics: GraphicsPool;
  labelTexts: TextPool;
  worldDetailSprites: SpritePool;
  worldMarkerSprites: ShadowedSpritePool;
  cloudShadowSprites: SpritePool;
  cloudSprites: SpritePool;
  player: ShadowedSpriteEntry;
}

export function getSceneCache(app: Application) {
  const cachedApp = app as CachedApplication;
  if (cachedApp[SCENE_CACHE_KEY]) return cachedApp[SCENE_CACHE_KEY];

  const sky = new Container();
  const world = new Container();
  const worldGround = new Container();
  const worldDetail = new Container();
  const worldMarkers = new Container();
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
  const worldMapFilters = [
    createWorldMapFishEyeFilter(),
    createWorldMapFishEyeFilter(),
    createWorldMapFishEyeFilter(),
  ];
  world.filters = [worldMapFilters[0]];
  waterfalls.filters = [worldMapFilters[1]];
  labels.filters = [worldMapFilters[2]];
  world.filterArea = worldMapFilterArea;
  waterfalls.filterArea = worldMapFilterArea;
  labels.filterArea = worldMapFilterArea;

  world.addChild(worldGround, worldDetail, worldMarkers, worldPlayer);
  app.stage.addChild(
    sky,
    world,
    waterfalls,
    labels,
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

  const player = createShadowedSprite(Icons.Player);
  worldPlayer.addChild(player.wrapper);

  const scene: SceneCache = {
    skyFill,
    overlayFill,
    world,
    waterfalls,
    labels,
    worldMapFilterArea,
    worldMapFilters,
    atmosphereShaftGraphics: createGraphicsPool(atmosphereShafts),
    atmosphereCelestialGraphics: createGraphicsPool(atmosphereCelestials),
    worldGroundGraphics: createGraphicsPool(worldGround),
    worldDetailGraphics: createGraphicsPool(worldDetail),
    waterfallGraphics: createGraphicsPool(waterfalls),
    labelTexts: createTextPool(labels),
    worldDetailSprites: createSpritePool(worldDetail),
    worldMarkerSprites: createShadowedSpritePool(worldMarkers),
    cloudShadowSprites: createSpritePool(cloudShadows),
    cloudSprites: createSpritePool(clouds),
    player,
  };

  cachedApp[SCENE_CACHE_KEY] = scene;
  return scene;
}

export function beginSceneRender(scene: SceneCache) {
  resetGraphicsPool(scene.atmosphereShaftGraphics);
  resetGraphicsPool(scene.atmosphereCelestialGraphics);
  resetGraphicsPool(scene.worldGroundGraphics);
  resetGraphicsPool(scene.worldDetailGraphics);
  resetGraphicsPool(scene.waterfallGraphics);
  resetTextPool(scene.labelTexts);
  resetSpritePool(scene.worldDetailSprites);
  resetShadowedSpritePool(scene.worldMarkerSprites);
  resetSpritePool(scene.cloudShadowSprites);
  resetSpritePool(scene.cloudSprites);
}

export function completeSceneRender(scene: SceneCache) {
  finishGraphicsPool(scene.atmosphereShaftGraphics);
  finishGraphicsPool(scene.atmosphereCelestialGraphics);
  finishGraphicsPool(scene.worldGroundGraphics);
  finishGraphicsPool(scene.worldDetailGraphics);
  finishGraphicsPool(scene.waterfallGraphics);
  finishTextPool(scene.labelTexts);
  finishSpritePool(scene.worldDetailSprites);
  finishShadowedSpritePool(scene.worldMarkerSprites);
  finishSpritePool(scene.cloudShadowSprites);
  finishSpritePool(scene.cloudSprites);
}
