import { getEnemiesAt } from '../../game/stateSelectors';
import type { GameState } from '../../game/stateTypes';
import {
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

export type VisibleTileEnemies = ReturnType<typeof getEnemiesAt>;

export interface VisibleTileRenderInput {
  enemies: VisibleTileEnemies;
  hostileEnemies: VisibleTileEnemies;
  tile: VisibleWorldTile;
}

export function getVisibleTileRenderInputs(
  state: GameState,
  visibleTiles: VisibleWorldTile[],
) {
  return visibleTiles.map((tile) => getVisibleTileRenderInput(state, tile));
}

export function getVisibleTileRenderInput(
  state: GameState,
  tile: VisibleWorldTile,
): VisibleTileRenderInput {
  if (isUnknownVisibleWorldTile(tile)) {
    return {
      enemies: [],
      hostileEnemies: [],
      tile,
    };
  }

  const enemies = getEnemiesAt(state, tile.coord);

  return {
    enemies,
    hostileEnemies: enemies.filter((enemy) => enemy.aggressive !== false),
    tile,
  };
}
