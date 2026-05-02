import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { isPassable } from '../../game/shared';
import type { GameState, HexCoord } from '../../game/stateTypes';
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
import {
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

interface MovementTransitionRenderState {
  durationMs: number;
  fromCoord: HexCoord;
  incomingTiles: VisibleWorldTile[];
  nowMs: number;
  outgoingTiles: VisibleWorldTile[];
  startedAtMs: number;
  toCoord: HexCoord;
}

interface RenderTilePassesOptions {
  animationMs: number;
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
  movementTransition: MovementTransitionRenderState | null;
  visibleTileMap: Map<string, VisibleWorldTile> | null;
  visibleTileRenderInputs: VisibleTileRenderInput[] | null;
  visibleTiles: VisibleWorldTile[];
  worldBossIconSize: number;
  scene: SceneCache;
}

export function renderTilePasses({
  animationMs,
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
  movementTransition,
  visibleTileMap,
  visibleTileRenderInputs,
  visibleTiles,
  worldBossIconSize,
  scene,
}: RenderTilePassesOptions) {
  const nextCampfireLightPoints: Array<{ x: number; y: number }> = [];
  const movementTransitionState =
    getMovementTransitionState(movementTransition);

  visibleTiles.forEach((tile, tileIndex) => {
    const tileKey = hexKey(tile.coord);
    const distance = hexDistance(state.player.coord, tile.coord);
    const isOutgoingTile =
      movementTransitionState?.outgoingTileKeys.has(tileKey) ?? false;
    const isPlayerTile =
      tile.coord.q === state.player.coord.q &&
      tile.coord.r === state.player.coord.r;
    const clickable =
      !isOutgoingTile &&
      distance === 1 &&
      !isUnknownVisibleWorldTile(tile) &&
      isPassable(tile.terrain);
    const emphasized = isPlayerTile;
    const revealed = isOutgoingTile || distance <= WORLD_REVEAL_RADIUS;
    const appearanceAlpha =
      getTileTransitionAlpha(movementTransitionState, tileKey) ?? 1;
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
        animationMs,
        isHomeTile,
        isPlayerTile,
        nextCampfireLightPoints,
        point,
        poly,
        revealed,
        appearanceAlpha,
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

    if (shouldRenderInteraction && !isOutgoingTile) {
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

function getMovementTransitionState(
  movementTransition: MovementTransitionRenderState | null,
) {
  if (!movementTransition) {
    return null;
  }

  const progress = Math.max(
    0,
    Math.min(
      1,
      (movementTransition.nowMs - movementTransition.startedAtMs) /
        movementTransition.durationMs,
    ),
  );

  return {
    incomingAlpha: progress,
    incomingTileKeys: new Set(
      movementTransition.incomingTiles.map((tile) => hexKey(tile.coord)),
    ),
    outgoingAlpha: 1 - progress,
    outgoingTileKeys: new Set(
      movementTransition.outgoingTiles.map((tile) => hexKey(tile.coord)),
    ),
  };
}

function getTileTransitionAlpha(
  movementTransitionState: ReturnType<typeof getMovementTransitionState>,
  tileKey: string,
) {
  if (!movementTransitionState) {
    return null;
  }

  if (movementTransitionState.outgoingTileKeys.has(tileKey)) {
    return movementTransitionState.outgoingAlpha;
  }

  if (movementTransitionState.incomingTileKeys.has(tileKey)) {
    return movementTransitionState.incomingAlpha;
  }

  return 1;
}
