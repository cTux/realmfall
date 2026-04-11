import { type Application } from 'pixi.js';
import {
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type GameState,
  type HexCoord,
} from '../../game/state';
import {
  enemyIconFor,
  enemyTint,
  structureIconFor,
  structureTint,
} from '../icons';
import { HEX_SIZE } from '../../app/constants';
import { scaleColor } from './timeOfDay';
import {
  ENEMY_GROUP_LABEL_STYLE,
  ENEMY_LEVEL_LABEL_STYLE,
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
import { enemyOffsets, makeHex, tileToPoint } from './renderSceneMath';
import {
  renderCampfireLight,
  renderCloudLayer,
  renderTileGroundCover,
  tileStyle,
} from './renderSceneEnvironment';
import {
  configureShadowedSprite,
  takeGraphics,
  takeShadowedSprite,
  takeText,
} from './renderScenePools';

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
    getLightingState(app, worldTimeMinutes, animationMs);

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
  );

  visibleTiles.forEach((tile) => {
    const distance = hexDistance(state.player.coord, tile.coord);
    const isPlayerTile =
      tile.coord.q === state.player.coord.q &&
      tile.coord.r === state.player.coord.r;
    const clickable =
      distance === 1 && tile.terrain !== 'water' && tile.terrain !== 'mountain';
    const emphasized = distance === 0 || clickable;
    const relative = {
      q: tile.coord.q - state.player.coord.q,
      r: tile.coord.r - state.player.coord.r,
    };
    const point = tileToPoint(relative, origin.x, origin.y, HEX_SIZE);
    const poly = makeHex(point.x, point.y, HEX_SIZE);
    const style = tileStyle(tile.terrain);
    const hovered =
      hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
    const tileBrightness = hovered
      ? lighting.ambientBrightness + 0.2
      : lighting.ambientBrightness;
    const litTileColor = scaleColor(style.color, tileBrightness);
    const fillAlpha = hovered
      ? Math.min(1, style.alpha + 0.26)
      : emphasized
        ? style.alpha
        : 0.8;

    const shape = takeGraphics(scene.worldGroundGraphics);
    shape.beginFill(litTileColor, fillAlpha);
    shape.lineStyle(1, 0x1e293b, 0.9);
    shape.drawPolygon(poly);
    shape.endFill();

    renderTileGroundCover(
      scene.worldDetailSprites,
      tile,
      point,
      lighting.ambientBrightness,
      state.seed,
    );

    if (tile.structure === 'camp') {
      renderCampfireLight(
        scene.worldDetailGraphics,
        point,
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

    const enemies = getEnemiesAt(state, tile.coord);

    if (tile.structure) {
      const structureColor =
        tile.structure === 'dungeon' && enemies.length === 0
          ? 0x94a3b8
          : structureTint(tile.structure);
      const marker = takeShadowedSprite(
        scene.worldMarkerSprites,
        structureIconFor(tile.structure),
      );
      configureShadowedSprite(
        marker,
        scaleColor(structureColor, lighting.ambientBrightness + 0.08),
        42,
        42,
        emphasized ? 1 : 0.82,
        shadowOffset,
        point,
      );
    }

    if (enemies.length > 0 && tile.structure !== 'dungeon') {
      const offsets = enemyOffsets(enemies.length);
      enemies.forEach((enemy, index) => {
        const sprite = takeShadowedSprite(
          scene.worldMarkerSprites,
          enemyIconFor(enemy.name),
        );
        configureShadowedSprite(
          sprite,
          scaleColor(enemyTint(enemy.name), lighting.ambientBrightness + 0.04),
          32,
          32,
          emphasized ? 1 : 0.72,
          shadowOffset,
          {
            x: point.x + offsets[index].x,
            y: point.y - 2 + offsets[index].y,
          },
        );
      });

      const level = takeText(scene.labelTexts, ENEMY_LEVEL_LABEL_STYLE);
      level.text = `L${Math.max(...enemies.map((foe) => foe.tier))}`;
      level.position.set(point.x - 12, point.y - 32);
      level.alpha = emphasized ? 1 : 0.78;

      if (enemies.length > 1) {
        const groupLabel = takeText(scene.labelTexts, ENEMY_GROUP_LABEL_STYLE);
        groupLabel.text = `x${enemies.length}`;
        groupLabel.position.set(point.x + 8, point.y - 26);
        groupLabel.alpha = emphasized ? 1 : 0.78;
      }
    }
  });

  configureShadowedSprite(
    scene.player,
    scaleColor(0xffffff, Math.max(0.84, lighting.ambientBrightness + 0.08)),
    46,
    46,
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
