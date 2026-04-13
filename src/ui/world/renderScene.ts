import { type Application } from 'pixi.js';
import {
  getStructureConfig,
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type Enemy,
  type GameState,
  type HexCoord,
  type Tile,
} from '../../game/state';
import { hexKey } from '../../game/hex';
import { enemyIconFor, structureIconFor } from './worldIcons';
import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { scaleColor } from './timeOfDay';
import {
  beginAnimatedSceneRender,
  beginInteractionSceneRender,
  beginStaticSceneRender,
  completeAnimatedSceneRender,
  completeInteractionSceneRender,
  completeStaticSceneRender,
  getSceneCache,
} from './renderSceneCache';
import {
  getLightingState,
  renderAtmosphere,
  renderSkyLayer,
  renderWorldOverlay,
} from './renderSceneAtmosphere';
import { getWorldHexSize, makeHex, tileToPoint } from './renderSceneMath';
import {
  buildCloudRenderInputs,
  getTileGroundCoverPresentation,
  hasTileGroundCover,
  renderCampfireLight,
  renderCloudLayer,
  renderTileGroundCover,
  tileStyle,
} from './renderSceneEnvironment';
import {
  configureShadowedSprite,
  takeGraphics,
  takeShadowedSprite,
} from './renderScenePools';
import {
  updateWorldMapFishEyeFilter,
  WORLD_MAP_FISHEYE_ENABLED,
} from './worldMapFishEye';

export function renderScene(
  app: Application,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
  selected: HexCoord,
  hoveredMove: HexCoord | null,
  worldTimeMinutes = 12 * 60,
  animationMs = 0,
  hoveredSafePath: HexCoord[] | null = null,
) {
  const scene = getSceneCache(app);
  const cloudInputs = getCloudRenderInputs(scene, state.seed);

  const { lighting, origin, sunPosition, moonPosition, shadowOffset } =
    getLightingState(
      app,
      worldTimeMinutes,
      animationMs,
      state.bloodMoonActive,
      state.harvestMoonActive,
    );
  const hexSize = getWorldHexSize(app.screen, state.radius);
  const structureIconSize = hexSize * 1.065;
  const enemyIconSize = hexSize * 0.945;
  const playerIconSize = hexSize * 1.58;

  if (WORLD_MAP_FISHEYE_ENABLED) {
    scene.worldMapFilterArea.width = app.screen.width;
    scene.worldMapFilterArea.height = app.screen.height;
    updateWorldMapFishEyeFilter(scene.worldMapFilter, app.screen, origin);
  }

  renderSkyLayer(app, scene.skyFill, lighting.skyColor);
  beginAnimatedSceneRender(scene);
  renderAtmosphere(
    app,
    scene.atmosphereShaftGraphics,
    scene.atmosphereCelestialGraphics,
    lighting,
    animationMs,
    sunPosition,
    moonPosition,
    origin,
    state.bloodMoonActive,
    state.harvestMoonActive,
  );

  const screenChanged =
    scene.screenWidth !== app.screen.width ||
    scene.screenHeight !== app.screen.height;
  const shouldRenderStatic =
    screenChanged ||
    scene.staticState !== state ||
    scene.staticVisibleTiles !== visibleTiles;
  const shouldRenderInteraction =
    shouldRenderStatic ||
    scene.interactionState !== state ||
    scene.interactionVisibleTiles !== visibleTiles ||
    !sameCoord(scene.interactionSelected, selected) ||
    !sameCoord(scene.interactionHoveredMove, hoveredMove) ||
    scene.interactionHoveredSafePathKey !== pathKey(hoveredSafePath);

  const hoveredSafePathKeys = new Set(
    (hoveredSafePath ?? []).map((coord) => hexKey(coord)),
  );

  if (shouldRenderStatic) {
    beginStaticSceneRender(scene);
  }
  if (shouldRenderInteraction) {
    beginInteractionSceneRender(scene);
  }

  visibleTiles.forEach((tile) => {
    const distance = hexDistance(state.player.coord, tile.coord);
    const isPlayerTile =
      tile.coord.q === state.player.coord.q &&
      tile.coord.r === state.player.coord.r;
    const clickable =
      distance === 1 && tile.terrain !== 'rift' && tile.terrain !== 'mountain';
    const emphasized = distance === 0 || clickable;
    const revealed = distance <= WORLD_REVEAL_RADIUS;
    const relative = {
      q: tile.coord.q - state.player.coord.q,
      r: tile.coord.r - state.player.coord.r,
    };
    const point = tileToPoint(relative, origin.x, origin.y, hexSize);
    const poly = makeHex(point.x, point.y, hexSize);
    const style = tileStyle(tile.terrain);
    const hovered =
      hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
    const highlightedInSafePath = hoveredSafePathKeys.has(hexKey(tile.coord));
    const isHomeTile =
      tile.coord.q === state.homeHex.q && tile.coord.r === state.homeHex.r;
    const hasBackground = hasTileGroundCover(tile.terrain);
    if (shouldRenderStatic) {
      const fillAlpha = hasBackground ? 0.2 : emphasized ? style.alpha : 0.8;
      const shape = takeGraphics(scene.worldGroundGraphics);
      shape.beginFill(style.color, fillAlpha);
      shape.lineStyle(1, 0x1e293b, 0.9);
      shape.drawPolygon(poly);
      shape.endFill();

      if (!revealed) {
        const fog = takeGraphics(scene.worldStaticDetailGraphics);
        fog.beginFill(0x020617, 0.78);
        fog.drawPolygon(poly);
        fog.endFill();
      }
    }

    if (!revealed) {
      return;
    }

    const enemies = getEnemiesAt(state, tile.coord);

    if (shouldRenderStatic) {
      const groundCoverPresentation = getTileGroundCoverPresentationCached(
        scene,
        tile,
        enemies,
        state.seed,
      );

      renderTileGroundCover(
        scene.worldStaticDetailSprites,
        groundCoverPresentation,
        point,
        hexSize,
      );

      if (tile.structure) {
        const structureColor = getStructureConfig(tile.structure).tint;
        const marker = takeShadowedSprite(
          scene.worldStaticMarkerSprites,
          structureIconFor(tile.structure),
        );
        configureShadowedSprite(
          marker,
          structureColor,
          structureIconSize,
          structureIconSize,
          1,
          shadowOffset,
          point,
        );
      }

      if (enemies.length > 0 && tile.structure !== 'dungeon') {
        const leadEnemy = enemies[0];
        const sprite = takeShadowedSprite(
          scene.worldStaticMarkerSprites,
          enemyIconFor(leadEnemy.name),
        );
        configureShadowedSprite(
          sprite,
          0xef4444,
          enemyIconSize,
          enemyIconSize,
          1,
          shadowOffset,
          {
            x: point.x,
            y: point.y - 2,
          },
        );
      }
    }

    if (tile.structure === 'camp') {
      renderCampfireLight(
        scene.worldAnimatedDetailGraphics,
        point,
        hexSize,
        lighting.ambientBrightness,
        lighting,
        animationMs,
      );
    }

    if (shouldRenderInteraction) {
      if (isHomeTile) {
        const homeOutline = takeGraphics(scene.worldInteractionGraphics);
        homeOutline.lineStyle(3, 0xa855f7, 0.92);
        homeOutline.drawPolygon(poly);
      }

      if (hovered) {
        const hoverOverlay = takeGraphics(scene.worldInteractionGraphics);
        hoverOverlay.beginFill(
          style.color,
          hasBackground ? 0.2 : Math.min(1, style.alpha + 0.26),
        );
        hoverOverlay.drawPolygon(poly);
        hoverOverlay.endFill();
      }

      if (highlightedInSafePath) {
        const safePathOverlay = takeGraphics(scene.worldInteractionGraphics);
        safePathOverlay.lineStyle(3, 0x38bdf8, hovered ? 0.9 : 0.72);
        safePathOverlay.drawPolygon(poly);
      }

      if (
        !hovered &&
        !isPlayerTile &&
        selected.q === tile.coord.q &&
        selected.r === tile.coord.r
      ) {
        const outline = takeGraphics(scene.worldInteractionGraphics);
        outline.lineStyle(3, 0xf8fafc, 0.65);
        outline.drawPolygon(poly);
      } else if (tile.items.length > 0 && emphasized) {
        const lootBorder = takeGraphics(scene.worldInteractionGraphics);
        lootBorder.lineStyle(3, 0x22c55e, 0.95);
        lootBorder.drawPolygon(poly);
      }
    }
  });

  if (shouldRenderStatic) {
    completeStaticSceneRender(scene);
    scene.staticState = state;
    scene.staticVisibleTiles = visibleTiles;
  }

  if (shouldRenderInteraction) {
    completeInteractionSceneRender(scene);
    scene.interactionState = state;
    scene.interactionVisibleTiles = visibleTiles;
    scene.interactionSelected = { ...selected };
    scene.interactionHoveredMove = hoveredMove ? { ...hoveredMove } : null;
    scene.interactionHoveredSafePathKey = pathKey(hoveredSafePath);
  }

  scene.screenWidth = app.screen.width;
  scene.screenHeight = app.screen.height;

  configureShadowedSprite(
    scene.player,
    scaleColor(0xffffff, Math.max(0.84, lighting.ambientBrightness + 0.08)),
    playerIconSize,
    playerIconSize,
    1,
    shadowOffset,
    origin,
  );

  renderCloudLayer(
    app.screen,
    scene.cloudShadowSprites,
    scene.cloudSprites,
    animationMs,
    lighting,
    cloudInputs,
    shadowOffset,
  );
  renderWorldOverlay(
    app,
    scene.overlayFill,
    lighting.overlayColor,
    lighting.overlayAlpha,
  );
  completeAnimatedSceneRender(scene);
}

function getCloudRenderInputs(
  scene: ReturnType<typeof getSceneCache>,
  seed: string,
) {
  let cloudInputs = scene.cloudInputsBySeed.get(seed);
  if (!cloudInputs) {
    cloudInputs = buildCloudRenderInputs(seed);
    scene.cloudInputsBySeed.set(seed, cloudInputs);
  }

  return cloudInputs;
}

function getTileGroundCoverPresentationCached(
  scene: ReturnType<typeof getSceneCache>,
  tile: Tile,
  enemies: Enemy[],
  worldSeed: string,
) {
  const herbs = tile.items.some((item) => item.name === 'Herbs')
    ? 'herbs'
    : 'none';
  const key = `${worldSeed}:${tile.coord.q},${tile.coord.r}:${tile.terrain}:${tile.structure ?? 'none'}:${enemies.length}:${herbs}`;
  let presentation = scene.tileGroundCoverPresentationByKey.get(key);
  if (!presentation) {
    presentation = getTileGroundCoverPresentation(tile, enemies, worldSeed);
    scene.tileGroundCoverPresentationByKey.set(key, presentation);
  }

  return presentation;
}

function sameCoord(left: HexCoord | null, right: HexCoord | null) {
  if (left == null || right == null) {
    return left === right;
  }

  return left.q === right.q && left.r === right.r;
}

function pathKey(path: HexCoord[] | null) {
  return path?.map((coord) => hexKey(coord)).join('|') ?? null;
}
