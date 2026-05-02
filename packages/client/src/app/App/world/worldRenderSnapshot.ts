import type { GameState, HexCoord } from '../../../game/stateTypes';
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';

export interface WorldRenderSnapshot {
  game: GameState | null;
  visibleTiles: VisibleWorldTile[] | null;
  selected: HexCoord | null;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  animationBucket: number;
  invalidationToken: number;
  iconTextureVersion: number;
  movementCooldownEndAtMs: number | null;
  movementCooldownRenderToken: number;
  showTerrainBackgrounds: boolean;
  worldRenderFps: number;
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
    movementCooldownEndAtMs: null,
    movementCooldownRenderToken: -1,
    showTerrainBackgrounds: true,
    worldRenderFps: 0,
  };
}
