import type { getVisibleTiles } from '../../../game/stateSelectors';
import type { GameState, HexCoord } from '../../../game/stateTypes';

export interface WorldRenderSnapshot {
  game: GameState | null;
  visibleTiles: ReturnType<typeof getVisibleTiles> | null;
  selected: HexCoord | null;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  animationBucket: number;
  invalidationToken: number;
  iconTextureVersion: number;
  showTerrainBackgrounds: boolean;
}

export function createInitialWorldRenderSnapshot(): WorldRenderSnapshot {
  return {
    game: null,
    visibleTiles: null,
    selected: null,
    hoveredMove: null,
    hoveredSafePath: null,
    animationBucket: -1,
    invalidationToken: 0,
    iconTextureVersion: -1,
    showTerrainBackgrounds: true,
  };
}
