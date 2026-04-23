import { enemyRarityIndex, getEnemiesAt } from '../../game/stateSelectors';
import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { isPassable } from '../../game/shared';
import type { GameState, HexCoord, Tile } from '../../game/stateTypes';
import { hexDistance, hexKey } from '../../game/hex';
import { buildTile } from '../../game/world';
import {
  getPlacedWorldBossCenter,
  isWorldBossEnemyId,
} from '../../game/worldBoss';
import {
  WorldIcons,
  enemyIconFor,
  enemyIconTintFor,
  structureIconFor,
} from './worldIcons';
import { tileStyle } from './renderSceneEnvironment';
import { makeHex, tileToPoint } from './renderSceneMath';
import {
  configureShadowedSprite,
  configureSprite,
  takeGraphics,
  takeShadowedSprite,
  takeSprite,
  takeText,
} from './renderScenePools';
import { ENEMY_GROUP_LABEL_STYLE, type SceneCache } from './renderSceneCache';
import { terrainArtFor } from './worldTerrainArt';
import {
  ENEMY_GROUP_BADGE_OFFSET,
  getStructureHexIconTint,
  HOME_HEX_TINT_ALPHA,
  HOME_HEX_TINT_COLOR,
  HOME_HEX_TINT_INSET,
  makeInsetHex,
  registerAnimatedWorldMarker,
  SAFE_PATH_HEX_INSET,
  SAFE_PATH_TINT_ALPHA,
  SAFE_PATH_TINT_COLOR,
  structureEmitsCampfireLight,
  WORLD_BOSS_HEX_TINT_ALPHA,
  WORLD_BOSS_HEX_TINT_COLOR,
} from './renderSceneShared';

const HEX_SIDE_VERTEX_INDICES = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
] as const;

interface RenderTilePassesOptions {
  enemyIconSize: number;
  hexSize: number;
  hoveredMove: HexCoord | null;
  hoveredSafePathKeys: Set<string> | null;
  origin: { x: number; y: number };
  selected: HexCoord;
  shadowOffset: { x: number; y: number };
  shouldRenderInteraction: boolean;
  shouldRenderStatic: boolean;
  showTerrainBackgrounds: boolean;
  state: GameState;
  structureIconSize: number;
  terrainArtSize: number;
  visibleTileMap: Map<string, Tile> | null;
  visibleTiles: Array<Tile>;
  worldBossIconSize: number;
  scene: SceneCache;
}

export function renderTilePasses({
  enemyIconSize,
  hexSize,
  hoveredMove,
  hoveredSafePathKeys,
  origin,
  selected,
  shadowOffset,
  shouldRenderInteraction,
  shouldRenderStatic,
  showTerrainBackgrounds,
  state,
  structureIconSize,
  terrainArtSize,
  visibleTileMap,
  visibleTiles,
  worldBossIconSize,
  scene,
}: RenderTilePassesOptions) {
  const nextCampfireLightPoints: Array<{ x: number; y: number }> = [];

  visibleTiles.forEach((tile) => {
    const distance = hexDistance(state.player.coord, tile.coord);
    const isPlayerTile =
      tile.coord.q === state.player.coord.q &&
      tile.coord.r === state.player.coord.r;
    const clickable = distance === 1 && isPassable(tile.terrain);
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
      renderStaticTile({
        emphasized,
        enemyIconSize,
        isHomeTile,
        isPlayerTile,
        nextCampfireLightPoints,
        point,
        poly,
        revealed,
        safePolygon,
        scene,
        shadowOffset,
        showTerrainBackgrounds,
        state,
        structureIconSize,
        style,
        terrainArtSize,
        tile,
        visibleTileMap,
        worldBossIconSize,
      });
    }

    if (!revealed) {
      return;
    }

    if (shouldRenderInteraction) {
      renderInteractionTile({
        clickable,
        highlightedInSafePath,
        hovered,
        isPlayerTile,
        point: tile.coord,
        poly,
        safePolygon,
        scene,
        selected,
        style,
        tile,
      });
    }
  });

  if (shouldRenderStatic) {
    scene.campfireLightPoints = nextCampfireLightPoints;
  }
}

function renderStaticTile({
  emphasized,
  enemyIconSize,
  isHomeTile,
  isPlayerTile,
  nextCampfireLightPoints,
  point,
  poly,
  revealed,
  safePolygon,
  scene,
  shadowOffset,
  showTerrainBackgrounds,
  state,
  structureIconSize,
  style,
  terrainArtSize,
  tile,
  visibleTileMap,
  worldBossIconSize,
}: {
  emphasized: boolean;
  enemyIconSize: number;
  isHomeTile: boolean;
  isPlayerTile: boolean;
  nextCampfireLightPoints: Array<{ x: number; y: number }>;
  point: { x: number; y: number };
  poly: number[];
  revealed: boolean;
  safePolygon: number[];
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  showTerrainBackgrounds: boolean;
  state: GameState;
  structureIconSize: number;
  style: ReturnType<typeof tileStyle>;
  terrainArtSize: number;
  tile: Tile;
  visibleTileMap: Map<string, Tile> | null;
  worldBossIconSize: number;
}) {
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
    return;
  }

  if (showTerrainBackgrounds) {
    const terrainSprite = takeSprite(
      scene.worldTerrainSprites,
      terrainArtFor(tile.terrain),
    );
    configureSprite(
      terrainSprite,
      0xffffff,
      terrainArtSize,
      terrainArtSize,
      emphasized ? 0.84 : 0.76,
      point,
    );
  }

  const enemies = getEnemiesAt(state, tile.coord);

  if (!isPlayerTile) {
    renderStaticMarkers({
      enemyIconSize,
      enemies,
      point,
      scene,
      shadowOffset,
      state,
      structureIconSize,
      tile,
      visibleTileMap,
      worldBossIconSize,
    });
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

  if (structureEmitsCampfireLight(tile.structure)) {
    nextCampfireLightPoints.push(point);
  }
}

function renderStaticMarkers({
  enemyIconSize,
  enemies,
  point,
  scene,
  shadowOffset,
  state,
  structureIconSize,
  tile,
  visibleTileMap,
  worldBossIconSize,
}: {
  enemyIconSize: number;
  enemies: ReturnType<typeof getEnemiesAt>;
  point: { x: number; y: number };
  scene: SceneCache;
  shadowOffset: { x: number; y: number };
  state: GameState;
  structureIconSize: number;
  tile: Tile;
  visibleTileMap: Map<string, Tile> | null;
  worldBossIconSize: number;
}) {
  if (tile.structure) {
    const marker = takeShadowedSprite(
      scene.worldStaticMarkerSprites,
      tile.structure === 'town' && tile.claim?.ownerType === 'faction'
        ? WorldIcons.Castle
        : structureIconFor(tile.structure),
    );
    const tint = getStructureHexIconTint(tile.structure);
    configureShadowedSprite(
      marker,
      tint,
      structureIconSize,
      structureIconSize,
      1,
      shadowOffset,
      point,
    );
    registerAnimatedWorldMarker(
      scene,
      state.seed,
      tile.coord,
      marker,
      point,
      structureIconSize,
      structureIconSize,
      tint,
      'resource',
    );
  }

  const hostileEnemies = enemies.filter((enemy) => enemy.aggressive !== false);

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
    registerAnimatedWorldMarker(
      scene,
      state.seed,
      tile.coord,
      marker,
      point,
      enemyIconSize,
      enemyIconSize,
      0xffffff,
      'settlement',
    );
    return;
  }

  if (hostileEnemies.length > 0 && tile.structure !== 'dungeon') {
    const worldBossCenter = getPlacedWorldBossCenter(
      tile.coord,
      (bossCoord) => visibleTileMap?.get(hexKey(bossCoord))?.enemyIds,
    );
    const leadEnemy = hostileEnemies[0];
    const highestRarityEnemy = hostileEnemies.reduce(
      (highest, enemy) =>
        enemyRarityIndex(enemy.rarity) > enemyRarityIndex(highest.rarity)
          ? enemy
          : highest,
      leadEnemy,
    );
    const isBossCenter = tile.enemyIds.some((enemyId) =>
      isWorldBossEnemyId(enemyId),
    );
    if (!worldBossCenter || isBossCenter) {
      const sprite = takeShadowedSprite(
        scene.worldStaticMarkerSprites,
        enemyIconFor(leadEnemy),
      );
      const tint = enemyIconTintFor(highestRarityEnemy);
      const markerPoint = isBossCenter
        ? point
        : {
            x: point.x,
            y: point.y - 2,
          };
      const markerSize = isBossCenter ? worldBossIconSize : enemyIconSize;
      configureShadowedSprite(
        sprite,
        tint,
        markerSize,
        markerSize,
        1,
        shadowOffset,
        markerPoint,
      );
      registerAnimatedWorldMarker(
        scene,
        state.seed,
        tile.coord,
        sprite,
        markerPoint,
        markerSize,
        markerSize,
        tint,
        isBossCenter ? 'worldBoss' : 'enemy',
      );

      if (!isBossCenter && enemies.length >= 2) {
        renderEnemyGroupBadge(scene, point, enemies.length);
      }
    }
  }

  if (tile.structure === 'dungeon' && enemies.length > 0) {
    renderEnemyGroupBadge(scene, point, enemies.length);
  }
}

function renderInteractionTile({
  clickable,
  highlightedInSafePath,
  hovered,
  isPlayerTile,
  point,
  poly,
  safePolygon,
  scene,
  selected,
  style,
  tile,
}: {
  clickable: boolean;
  highlightedInSafePath: boolean;
  hovered: boolean;
  isPlayerTile: boolean;
  point: HexCoord;
  poly: number[];
  safePolygon: number[];
  scene: SceneCache;
  selected: HexCoord;
  style: ReturnType<typeof tileStyle>;
  tile: Tile;
}) {
  if (hovered) {
    const hoverOverlay = takeGraphics(scene.worldInteractionGraphics);
    hoverOverlay.poly(clickable ? safePolygon : poly).fill({
      color: clickable ? SAFE_PATH_TINT_COLOR : style.color,
      alpha: clickable ? SAFE_PATH_TINT_ALPHA : Math.min(1, style.alpha + 0.26),
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
    selected.q === point.q &&
    selected.r === point.r
  ) {
    const outline = takeGraphics(scene.worldInteractionGraphics);
    outline.poly(poly).stroke({ width: 3, color: 0xf8fafc, alpha: 0.65 });
  } else if (tile.items.length > 0 && isPlayerTile) {
    const lootBorder = takeGraphics(scene.worldInteractionGraphics);
    lootBorder.poly(poly).stroke({ width: 3, color: 0x22c55e, alpha: 0.95 });
  }
}

function renderClaimBorder(
  graphicsPool: SceneCache['worldBorderGraphics'],
  state: GameState,
  tile: Tile,
  poly: number[],
  visibleTileMap: Map<string, Tile>,
) {
  const claim = tile.claim;
  if (!claim) return;

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
        color: 0xffffff,
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

function renderEnemyGroupBadge(
  scene: SceneCache,
  point: { x: number; y: number },
  count: number,
) {
  const badgeLabel = takeText(
    scene.worldStaticMarkerTexts,
    ENEMY_GROUP_LABEL_STYLE,
  );
  badgeLabel.text = count.toString();
  badgeLabel.anchor.set(0.5);
  badgeLabel.position.set(
    point.x + ENEMY_GROUP_BADGE_OFFSET.x,
    point.y + ENEMY_GROUP_BADGE_OFFSET.y,
  );
}
