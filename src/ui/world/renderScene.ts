import { type Application } from 'pixi.js';
import {
  getEnemyConfig,
  getStructureConfig,
  getEnemiesAt,
  getVisibleTiles,
  hexDistance,
  type GameState,
  type HexCoord,
  type Tile,
} from '../../game/state';
import { hexKey } from '../../game/hex';
import { buildTile } from '../../game/world';
import {
  getPlacedWorldBossCenter,
  isWorldBossEnemyId,
} from '../../game/worldBoss';
import { WorldIcons, enemyIconFor, structureIconFor } from './worldIcons';
import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { scaleColor } from './timeOfDay';
import {
  beginAnimatedSceneRender,
  beginInteractionSceneRender,
  beginStaticSceneRender,
  completeAnimatedSceneRender,
  completeInteractionSceneRender,
  completeStaticSceneRender,
  getCachedValue,
  getSceneCache,
  SCENE_CACHE_LIMITS,
  setBoundedCachedValue,
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
  renderCampfireLight,
  renderCloudLayer,
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

const HEX_SIDE_VERTEX_INDICES = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
] as const;
const HOME_HEX_TINT_COLOR = 0xa855f7;
const HOME_HEX_TINT_ALPHA = 0.22;
const SAFE_PATH_TINT_COLOR = 0x38bdf8;
const SAFE_PATH_TINT_ALPHA = 0.34;
const SAFE_PATH_HEX_INSET = 2;
const HOME_HEX_TINT_INSET = 3;
const WORLD_BOSS_ICON_TINT = 0x7f1d1d;
const WORLD_BOSS_HEX_TINT_COLOR = 0x7f1d1d;
const WORLD_BOSS_HEX_TINT_ALPHA = 0.22;

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
  const worldBossIconSize = hexSize * 3.4;
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
  const visibleTileMap = new Map(
    visibleTiles.map((tile) => [hexKey(tile.coord), tile] as const),
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
    const emphasized = isPlayerTile;
    const revealed = distance <= WORLD_REVEAL_RADIUS;
    const relative = {
      q: tile.coord.q - state.player.coord.q,
      r: tile.coord.r - state.player.coord.r,
    };
    const point = tileToPoint(relative, origin.x, origin.y, hexSize);
    const poly = makeHex(point.x, point.y, hexSize);
    const style = tileStyle(tile.terrain);
    const worldBossCenter = getPlacedWorldBossCenter(
      tile.coord,
      (bossCoord) => visibleTileMap.get(hexKey(bossCoord))?.enemyIds,
    );
    const isWorldBossFootprint = worldBossCenter !== null;
    const isHomeTile =
      tile.coord.q === state.homeHex.q && tile.coord.r === state.homeHex.r;
    const hovered =
      hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
    const highlightedInSafePath = hoveredSafePathKeys.has(hexKey(tile.coord));
    const insetPx = isHomeTile
      ? HOME_HEX_TINT_INSET
      : highlightedInSafePath
        ? SAFE_PATH_HEX_INSET
        : 0;
    const safePolygon = makeInsetHex(point, hexSize, insetPx);
    if (shouldRenderStatic) {
      const fillAlpha = emphasized ? style.alpha : 0.8;
      const shape = takeGraphics(scene.worldGroundGraphics);
      shape.beginFill(style.color, fillAlpha);
      shape.lineStyle(1, 0x1e293b, 0.9);
      shape.drawPolygon(poly);
      shape.endFill();

      if (isHomeTile) {
        const homeTint = takeGraphics(scene.worldStaticDetailGraphics);
        homeTint.beginFill(HOME_HEX_TINT_COLOR, HOME_HEX_TINT_ALPHA);
        homeTint.drawPolygon(safePolygon);
        homeTint.endFill();
      }

      if (isWorldBossFootprint) {
        const worldBossTint = takeGraphics(scene.worldStaticDetailGraphics);
        worldBossTint.beginFill(
          WORLD_BOSS_HEX_TINT_COLOR,
          WORLD_BOSS_HEX_TINT_ALPHA,
        );
        worldBossTint.drawPolygon(poly);
        worldBossTint.endFill();
      }

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

      const hostileEnemies = enemies.filter(
        (enemy) => enemy.aggressive !== false,
      );

      if (tile.claim?.npc?.enemyId) {
        const marker = takeShadowedSprite(
          scene.worldStaticMarkerSprites,
          WorldIcons.Village,
        );
        configureShadowedSprite(
          marker,
          0xffffff,
          enemyIconSize,
          enemyIconSize,
          1,
          shadowOffset,
          point,
        );
      } else if (hostileEnemies.length > 0 && tile.structure !== 'dungeon') {
        const leadEnemy = hostileEnemies[0];
        const isBossCenter = tile.enemyIds.some((enemyId) =>
          isWorldBossEnemyId(enemyId),
        );
        if (!worldBossCenter || isBossCenter) {
          const sprite = takeShadowedSprite(
            scene.worldStaticMarkerSprites,
            enemyIconFor(leadEnemy.name),
          );
          configureShadowedSprite(
            sprite,
            isBossCenter
              ? WORLD_BOSS_ICON_TINT
              : (getEnemyConfig(leadEnemy.name)?.tint ?? 0xef4444),
            isBossCenter ? worldBossIconSize : enemyIconSize,
            isBossCenter ? worldBossIconSize : enemyIconSize,
            1,
            shadowOffset,
            isBossCenter
              ? point
              : {
                  x: point.x,
                  y: point.y - 2,
                },
          );
        }
      }

      if (tile.claim) {
        renderClaimBorder(
          scene.worldBorderGraphics,
          state,
          tile,
          poly,
          visibleTileMap,
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
          clickable ? SAFE_PATH_TINT_COLOR : style.color,
          clickable ? SAFE_PATH_TINT_ALPHA : Math.min(1, style.alpha + 0.26),
        );
        hoverOverlay.drawPolygon(clickable ? safePolygon : poly);
        hoverOverlay.endFill();
      }

      if (highlightedInSafePath) {
        const safePathOverlay = takeGraphics(scene.worldInteractionGraphics);
        safePathOverlay.beginFill(SAFE_PATH_TINT_COLOR, SAFE_PATH_TINT_ALPHA);
        safePathOverlay.drawPolygon(safePolygon);
        safePathOverlay.endFill();
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

function renderClaimBorder(
  graphicsPool: ReturnType<typeof getSceneCache>['worldBorderGraphics'],
  state: GameState,
  tile: Tile,
  poly: number[],
  visibleTileMap: Map<string, Tile>,
) {
  const claim = tile.claim;
  if (!claim) return;
  const borderColor = 0xffffff;

  const neighbors = [
    { q: tile.coord.q + 1, r: tile.coord.r },
    { q: tile.coord.q + 1, r: tile.coord.r - 1 },
    { q: tile.coord.q, r: tile.coord.r - 1 },
    { q: tile.coord.q - 1, r: tile.coord.r },
    { q: tile.coord.q - 1, r: tile.coord.r + 1 },
    { q: tile.coord.q, r: tile.coord.r + 1 },
  ];

  neighbors.forEach((neighbor, sideIndex) => {
    const neighborClaim = resolveNeighborClaim(state, visibleTileMap, neighbor);
    if (
      neighborClaim?.ownerId === claim.ownerId &&
      neighborClaim?.ownerType === claim.ownerType
    ) {
      return;
    }

    const [startVertexIndex, endVertexIndex] =
      HEX_SIDE_VERTEX_INDICES[sideIndex];
    const border = takeGraphics(graphicsPool);
    border.lineStyle(claim.ownerType === 'player' ? 4 : 3, borderColor, 0.92);
    border.moveTo(poly[startVertexIndex * 2], poly[startVertexIndex * 2 + 1]);
    border.lineTo(poly[endVertexIndex * 2], poly[endVertexIndex * 2 + 1]);
  });
}

function resolveNeighborClaim(
  state: GameState,
  visibleTileMap: Map<string, Tile>,
  coord: HexCoord,
) {
  const key = hexKey(coord);
  return (
    visibleTileMap.get(key)?.claim ??
    state.tiles[key]?.claim ??
    buildTile(state.seed, coord).claim
  );
}

function getCloudRenderInputs(
  scene: ReturnType<typeof getSceneCache>,
  seed: string,
) {
  let cloudInputs = getCachedValue(scene.cloudInputsBySeed, seed);
  if (!cloudInputs) {
    cloudInputs = buildCloudRenderInputs(seed);
    setBoundedCachedValue(
      scene.cloudInputsBySeed,
      seed,
      cloudInputs,
      SCENE_CACHE_LIMITS.cloudInputsBySeed,
    );
  }

  return cloudInputs;
}

function makeInsetHex(
  point: ReturnType<typeof tileToPoint>,
  size: number,
  inset: number,
) {
  return makeHex(point.x, point.y, Math.max(1, size - inset));
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
