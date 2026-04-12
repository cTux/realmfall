import { type Application } from 'pixi.js';
import {
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type GameState,
  type HexCoord,
} from '../../game/state';
import { enemyIconFor, structureIconFor } from '../icons';
import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { scaleColor } from './timeOfDay';
import {
  beginSceneRender,
  completeSceneRender,
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
  beginSceneRender(scene);

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
    const tileBrightness = hovered
      ? lighting.ambientBrightness + 0.2
      : lighting.ambientBrightness;
    const litTileColor = scaleColor(style.color, tileBrightness);
    const hasBackground = hasTileGroundCover(tile.terrain);
    const fillAlpha = hovered
      ? hasBackground
        ? 0.2
        : Math.min(1, style.alpha + 0.26)
      : hasBackground
        ? 0.2
        : emphasized
          ? style.alpha
          : 0.8;

    const shape = takeGraphics(scene.worldGroundGraphics);
    shape.beginFill(litTileColor, fillAlpha);
    shape.lineStyle(1, 0x1e293b, 0.9);
    shape.drawPolygon(poly);
    shape.endFill();

    if (!revealed) {
      const fog = takeGraphics(scene.worldDetailGraphics);
      fog.beginFill(0x020617, 0.78);
      fog.drawPolygon(poly);
      fog.endFill();
      return;
    }

    const enemies = getEnemiesAt(state, tile.coord);

    renderTileGroundCover(
      scene.worldDetailSprites,
      tile,
      enemies,
      point,
      hexSize,
      lighting.ambientBrightness,
      state.seed,
    );

    if (tile.structure === 'camp') {
      renderCampfireLight(
        scene.worldDetailGraphics,
        point,
        hexSize,
        lighting.ambientBrightness,
        lighting,
        animationMs,
      );
    }

    if (
      !hovered &&
      !isPlayerTile &&
      selected.q === tile.coord.q &&
      selected.r === tile.coord.r
    ) {
      const outline = takeGraphics(scene.worldDetailGraphics);
      outline.lineStyle(3, 0xf8fafc, 0.65);
      outline.drawPolygon(poly);
    } else if (tile.items.length > 0 && emphasized) {
      const lootBorder = takeGraphics(scene.worldDetailGraphics);
      lootBorder.lineStyle(3, 0x22c55e, 0.95);
      lootBorder.drawPolygon(poly);
    }

    if (tile.structure) {
      const structureColor =
        tile.structure === 'pond'
          ? 0x38bdf8
          : tile.structure === 'lake'
            ? 0x2563eb
            : 0xffffff;
      const marker = takeShadowedSprite(
        scene.worldMarkerSprites,
        structureIconFor(tile.structure),
      );
      configureShadowedSprite(
        marker,
        scaleColor(structureColor, lighting.ambientBrightness + 0.08),
        structureIconSize,
        structureIconSize,
        emphasized ? 1 : 0.82,
        shadowOffset,
        point,
      );
    }

    if (enemies.length > 0 && tile.structure !== 'dungeon') {
      const leadEnemy = enemies[0];
      const sprite = takeShadowedSprite(
        scene.worldMarkerSprites,
        enemyIconFor(leadEnemy.name),
      );
      configureShadowedSprite(
        sprite,
        scaleColor(0xffffff, lighting.ambientBrightness + 0.04),
        enemyIconSize,
        enemyIconSize,
        emphasized ? 1 : 0.72,
        shadowOffset,
        {
          x: point.x,
          y: point.y - 2,
        },
      );
    }
  });

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
  completeSceneRender(scene);
}
