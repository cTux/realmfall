import { type Application } from 'pixi.js';
import {
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
const STRUCTURE_HEX_ICON_TINT = 0xffffff;
const ENEMY_HEX_ICON_TINT = 0xef4444;
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
  const renderVersions = getSceneRenderVersions(scene, state, visibleTiles);
  const shouldRenderStatic =
    screenChanged || scene.staticRenderVersion !== renderVersions.static;
  const shouldRenderInteraction =
    shouldRenderStatic ||
    scene.interactionRenderVersion !==
      renderVersions.interactionWithSelection(
        selected,
        hoveredMove,
        hoveredSafePath,
      );
  const hoveredSafePathKeys =
    shouldRenderInteraction && hoveredSafePath
      ? new Set(hoveredSafePath.map((coord) => hexKey(coord)))
      : null;
  const visibleTileMap = shouldRenderStatic
    ? new Map(visibleTiles.map((tile) => [hexKey(tile.coord), tile] as const))
    : null;

  if (shouldRenderStatic) {
    beginStaticSceneRender(scene);
  }
  if (shouldRenderInteraction) {
    beginInteractionSceneRender(scene);
  }

  if (shouldRenderStatic || shouldRenderInteraction) {
    const nextCampfireLightPoints: Array<{ x: number; y: number }> = [];

    visibleTiles.forEach((tile) => {
      const distance = hexDistance(state.player.coord, tile.coord);
      const isPlayerTile =
        tile.coord.q === state.player.coord.q &&
        tile.coord.r === state.player.coord.r;
      const clickable =
        distance === 1 &&
        tile.terrain !== 'rift' &&
        tile.terrain !== 'mountain';
      const emphasized = isPlayerTile;
      const revealed = distance <= WORLD_REVEAL_RADIUS;
      const relative = {
        q: tile.coord.q - state.player.coord.q,
        r: tile.coord.r - state.player.coord.r,
      };
      const point = tileToPoint(relative, origin.x, origin.y, hexSize);
      const poly = makeHex(point.x, point.y, hexSize);
      const style = tileStyle(tile.terrain);
      const isHomeTile =
        tile.coord.q === state.homeHex.q && tile.coord.r === state.homeHex.r;
      const hovered =
        hoveredMove?.q === tile.coord.q && hoveredMove?.r === tile.coord.r;
      const highlightedInSafePath =
        hoveredSafePathKeys?.has(hexKey(tile.coord)) ?? false;
      const insetPx = isHomeTile
        ? HOME_HEX_TINT_INSET
        : highlightedInSafePath
          ? SAFE_PATH_HEX_INSET
          : 0;
      const safePolygon = makeInsetHex(point, hexSize, insetPx);

      if (shouldRenderStatic) {
        const worldBossCenter = getPlacedWorldBossCenter(
          tile.coord,
          (bossCoord) => visibleTileMap?.get(hexKey(bossCoord))?.enemyIds,
        );
        const isWorldBossFootprint = worldBossCenter !== null;
        const fillAlpha = emphasized ? style.alpha : 0.8;
        const shape = takeGraphics(scene.worldGroundGraphics);
        shape
          .poly(poly)
          .fill({ color: style.color, alpha: fillAlpha })
          .stroke({ width: 1, color: 0x1e293b, alpha: 0.9 });

        if (isHomeTile) {
          const homeTint = takeGraphics(scene.worldStaticDetailGraphics);
          homeTint.poly(safePolygon).fill({
            color: HOME_HEX_TINT_COLOR,
            alpha: HOME_HEX_TINT_ALPHA,
          });
        }

        if (isWorldBossFootprint) {
          const worldBossTint = takeGraphics(scene.worldStaticDetailGraphics);
          worldBossTint.poly(poly).fill({
            color: WORLD_BOSS_HEX_TINT_COLOR,
            alpha: WORLD_BOSS_HEX_TINT_ALPHA,
          });
        }

        if (!revealed) {
          const fog = takeGraphics(scene.worldStaticDetailGraphics);
          fog.poly(poly).fill({ color: 0x020617, alpha: 0.78 });
        }
      }

      if (!revealed) {
        return;
      }

      if (shouldRenderStatic) {
        const enemies = getEnemiesAt(state, tile.coord);

        if (tile.structure) {
          const marker = takeShadowedSprite(
            scene.worldStaticMarkerSprites,
            structureIconFor(tile.structure),
          );
          configureShadowedSprite(
            marker,
            getStructureHexIconTint(tile.structure),
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
          const worldBossCenter = getPlacedWorldBossCenter(
            tile.coord,
            (bossCoord) => visibleTileMap?.get(hexKey(bossCoord))?.enemyIds,
          );
          const leadEnemy = hostileEnemies[0];
          const isBossCenter = tile.enemyIds.some((enemyId) =>
            isWorldBossEnemyId(enemyId),
          );
          if (!worldBossCenter || isBossCenter) {
            const sprite = takeShadowedSprite(
              scene.worldStaticMarkerSprites,
              enemyIconFor(leadEnemy),
            );
            configureShadowedSprite(
              sprite,
              isBossCenter ? WORLD_BOSS_ICON_TINT : ENEMY_HEX_ICON_TINT,
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

        if (tile.claim && visibleTileMap) {
          renderClaimBorder(
            scene.worldBorderGraphics,
            state,
            tile,
            poly,
            visibleTileMap,
          );
        }

        if (tile.structure === 'camp' || tile.structure === 'furnace') {
          nextCampfireLightPoints.push(point);
        }
      }

      if (shouldRenderInteraction) {
        if (hovered) {
          const hoverOverlay = takeGraphics(scene.worldInteractionGraphics);
          hoverOverlay.poly(clickable ? safePolygon : poly).fill({
            color: clickable ? SAFE_PATH_TINT_COLOR : style.color,
            alpha: clickable
              ? SAFE_PATH_TINT_ALPHA
              : Math.min(1, style.alpha + 0.26),
          });
        }

        if (highlightedInSafePath) {
          const safePathOverlay = takeGraphics(scene.worldInteractionGraphics);
          safePathOverlay.poly(safePolygon).fill({
            color: SAFE_PATH_TINT_COLOR,
            alpha: SAFE_PATH_TINT_ALPHA,
          });
        }

        if (
          !hovered &&
          !isPlayerTile &&
          selected.q === tile.coord.q &&
          selected.r === tile.coord.r
        ) {
          const outline = takeGraphics(scene.worldInteractionGraphics);
          outline.poly(poly).stroke({ width: 3, color: 0xf8fafc, alpha: 0.65 });
        } else if (tile.items.length > 0 && emphasized) {
          const lootBorder = takeGraphics(scene.worldInteractionGraphics);
          lootBorder
            .poly(poly)
            .stroke({ width: 3, color: 0x22c55e, alpha: 0.95 });
        }
      }
    });

    if (shouldRenderStatic) {
      scene.campfireLightPoints = nextCampfireLightPoints;
    }
  }

  scene.campfireLightPoints.forEach((point) => {
    renderCampfireLight(
      scene.worldAnimatedDetailGraphics,
      point,
      hexSize,
      lighting.ambientBrightness,
      lighting,
      animationMs,
    );
  });

  if (shouldRenderStatic) {
    completeStaticSceneRender(scene);
    scene.staticRenderVersion = renderVersions.static;
  }

  if (shouldRenderInteraction) {
    completeInteractionSceneRender(scene);
    scene.interactionRenderVersion = renderVersions.interactionWithSelection(
      selected,
      hoveredMove,
      hoveredSafePath,
    );
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
    border
      .moveTo(poly[startVertexIndex * 2], poly[startVertexIndex * 2 + 1])
      .lineTo(poly[endVertexIndex * 2], poly[endVertexIndex * 2 + 1])
      .stroke({
        width: claim.ownerType === 'player' ? 4 : 3,
        color: borderColor,
        alpha: 0.92,
      });
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

function getSceneRenderVersions(
  scene: ReturnType<typeof getSceneCache>,
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  const playerCoordKey = coordKey(state.player.coord);
  const homeHexKey = coordKey(state.homeHex);

  if (
    scene.derivedRenderVisibleTilesSource !== visibleTiles ||
    scene.derivedRenderEnemiesSource !== state.enemies ||
    scene.derivedRenderPlayerCoordKey !== playerCoordKey ||
    scene.derivedRenderHomeHexKey !== homeHexKey ||
    scene.derivedRenderBloodMoonActive !== state.bloodMoonActive
  ) {
    scene.derivedRenderVisibleTilesSource = visibleTiles;
    scene.derivedRenderEnemiesSource = state.enemies;
    scene.derivedRenderPlayerCoordKey = playerCoordKey;
    scene.derivedRenderHomeHexKey = homeHexKey;
    scene.derivedRenderBloodMoonActive = state.bloodMoonActive;
    scene.derivedStaticRenderVersion = getStaticRenderVersion(
      state,
      visibleTiles,
    );
    scene.derivedInteractionRenderVersion = getInteractionRenderVersion(
      state,
      visibleTiles,
    );
  }

  const staticVersion = scene.derivedStaticRenderVersion ?? '';
  const interactionBaseVersion = scene.derivedInteractionRenderVersion ?? '';

  return {
    static: staticVersion,
    interactionWithSelection: (
      selected: HexCoord,
      hoveredMove: HexCoord | null,
      hoveredSafePath: HexCoord[] | null,
    ) =>
      `${interactionBaseVersion}|selected:${coordKey(selected)}|hover:${coordKey(hoveredMove)}|path:${pathKey(hoveredSafePath) ?? 'none'}`,
  };
}

function getStaticRenderVersion(
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  return [
    `player:${coordKey(state.player.coord)}`,
    `home:${coordKey(state.homeHex)}`,
    `bloodMoon:${state.bloodMoonActive ? 1 : 0}`,
    ...visibleTiles.map((tile) => getStaticTileRenderVersion(state, tile)),
  ].join('||');
}

function getStaticTileRenderVersion(state: GameState, tile: Tile) {
  const enemies = getEnemiesAt(state, tile.coord)
    .map((enemy) =>
      [
        enemy.id,
        enemy.enemyTypeId ?? enemy.name,
        enemy.aggressive === false ? 'calm' : 'hostile',
        enemy.worldBoss ? 'boss' : 'normal',
      ].join(':'),
    )
    .join(',');

  return [
    coordKey(tile.coord),
    tile.terrain,
    tile.structure ?? 'none',
    tile.claim
      ? `${tile.claim.ownerType}:${tile.claim.ownerId}:${tile.claim.npc?.enemyId ?? 'none'}`
      : 'claim:none',
    enemies,
  ].join('|');
}

function getInteractionRenderVersion(
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  const playerTile =
    visibleTiles.find((tile) => sameCoord(tile.coord, state.player.coord)) ??
    state.tiles[hexKey(state.player.coord)] ??
    buildTile(state.seed, state.player.coord);

  return [
    `player:${coordKey(state.player.coord)}`,
    `loot:${playerTile.items.length > 0 ? 1 : 0}`,
  ].join('|');
}

function makeInsetHex(
  point: ReturnType<typeof tileToPoint>,
  size: number,
  inset: number,
) {
  return makeHex(point.x, point.y, Math.max(1, size - inset));
}

function getStructureHexIconTint(structure: Tile['structure']) {
  if (
    structure === 'copper-ore' ||
    structure === 'iron-ore' ||
    structure === 'coal-ore'
  ) {
    return getStructureConfig(structure).tint;
  }

  return STRUCTURE_HEX_ICON_TINT;
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

function coordKey(coord: HexCoord | null) {
  return coord ? hexKey(coord) : 'none';
}
