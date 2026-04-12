import { type Application } from 'pixi.js';
import {
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type GameState,
  type HexCoord,
} from '../../game/state';
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
) {
  const scene = getSceneCache(app);

  const { lighting, origin, sunPosition, moonPosition, shadowOffset } =
    getLightingState(app, worldTimeMinutes, animationMs, state.bloodMoonActive);
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
  );

  const screenChanged =
    scene.screenWidth !== app.screen.width ||
    scene.screenHeight !== app.screen.height;
  const shouldRenderStatic =
    screenChanged ||
    scene.staticState !== state ||
    scene.staticVisibleTiles !== visibleTiles ||
    scene.staticWorldTimeMinutes !== worldTimeMinutes;
  const shouldRenderInteraction =
    shouldRenderStatic ||
    scene.interactionState !== state ||
    scene.interactionVisibleTiles !== visibleTiles ||
    scene.interactionWorldTimeMinutes !== worldTimeMinutes ||
    !sameCoord(scene.interactionSelected, selected) ||
    !sameCoord(scene.interactionHoveredMove, hoveredMove);

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
    const hasBackground = hasTileGroundCover(tile.terrain);
    if (shouldRenderStatic) {
      const fillAlpha = hasBackground ? 0.2 : emphasized ? style.alpha : 0.8;
      const shape = takeGraphics(scene.worldGroundGraphics);
      shape.beginFill(
        scaleColor(style.color, lighting.ambientBrightness),
        fillAlpha,
      );
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
      renderTileGroundCover(
        scene.worldStaticDetailSprites,
        tile,
        enemies,
        point,
        hexSize,
        lighting.ambientBrightness,
        state.seed,
      );

      if (tile.structure) {
        const structureColor =
          tile.structure === 'pond'
            ? 0x38bdf8
            : tile.structure === 'lake'
              ? 0x2563eb
              : 0xffffff;
        const marker = takeShadowedSprite(
          scene.worldStaticMarkerSprites,
          structureIconFor(tile.structure),
        );
        configureShadowedSprite(
          marker,
          scaleColor(structureColor, lighting.ambientBrightness + 0.08),
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
          scaleColor(0xef4444, lighting.ambientBrightness + 0.04),
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
      if (hovered) {
        const hoverOverlay = takeGraphics(scene.worldInteractionGraphics);
        hoverOverlay.beginFill(
          scaleColor(style.color, lighting.ambientBrightness + 0.2),
          hasBackground ? 0.2 : Math.min(1, style.alpha + 0.26),
        );
        hoverOverlay.drawPolygon(poly);
        hoverOverlay.endFill();
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
    scene.staticWorldTimeMinutes = worldTimeMinutes;
  }

  if (shouldRenderInteraction) {
    completeInteractionSceneRender(scene);
    scene.interactionState = state;
    scene.interactionVisibleTiles = visibleTiles;
    scene.interactionWorldTimeMinutes = worldTimeMinutes;
    scene.interactionSelected = { ...selected };
    scene.interactionHoveredMove = hoveredMove ? { ...hoveredMove } : null;
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
    state.seed,
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

function sameCoord(left: HexCoord | null, right: HexCoord | null) {
  if (left == null || right == null) {
    return left === right;
  }

  return left.q === right.q && left.r === right.r;
}
