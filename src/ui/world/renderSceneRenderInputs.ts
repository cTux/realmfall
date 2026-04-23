import { getEnemiesAt, getVisibleTiles } from '../../game/stateSelectors';
import type { GameState, Tile } from '../../game/stateTypes';

export type VisibleTileEnemies = ReturnType<typeof getEnemiesAt>;

export interface VisibleTileRenderInput {
  enemies: VisibleTileEnemies;
  hostileEnemies: VisibleTileEnemies;
  tile: Tile;
}

export function getVisibleTileRenderInputs(
  state: GameState,
  visibleTiles: ReturnType<typeof getVisibleTiles>,
) {
  return visibleTiles.map((tile) => getVisibleTileRenderInput(state, tile));
}

export function getVisibleTileRenderInput(
  state: GameState,
  tile: Tile,
): VisibleTileRenderInput {
  const enemies = getEnemiesAt(state, tile.coord);

  return {
    enemies,
    hostileEnemies: enemies.filter((enemy) => enemy.aggressive !== false),
    tile,
  };
}
