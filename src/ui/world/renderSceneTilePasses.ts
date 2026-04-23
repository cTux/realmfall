import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { isPassable } from '../../game/shared';
import type { GameState, HexCoord, Tile } from '../../game/stateTypes';
import { hexDistance, hexKey } from '../../game/hex';
import { tileStyle } from './renderSceneEnvironment';
import { makeHex, tileToPoint } from './renderSceneMath';
import { type SceneCache } from './renderSceneCache';
import {
  HOME_HEX_TINT_INSET,
  makeInsetHex,
  SAFE_PATH_HEX_INSET,
} from './renderSceneShared';
import { renderInteractionTile } from './renderSceneInteractionTiles';
import {
  getVisibleTileRenderInput,
  type VisibleTileRenderInput,
} from './renderSceneRenderInputs';
import { renderStaticTile } from './renderSceneStaticTiles';

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
  visibleTileRenderInputs: VisibleTileRenderInput[] | null;
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
  visibleTileRenderInputs,
  visibleTiles,
  worldBossIconSize,
  scene,
}: RenderTilePassesOptions) {
  const nextCampfireLightPoints: Array<{ x: number; y: number }> = [];

  visibleTiles.forEach((tile, tileIndex) => {
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
        visibleTileRenderInput:
          visibleTileRenderInputs?.[tileIndex] ??
          getVisibleTileRenderInput(state, tile),
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
