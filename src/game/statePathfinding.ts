import { WORLD_REVEAL_RADIUS } from './config';
import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { isPassable } from './shared';
import { getHostileEnemyIds, getTileAt } from './stateWorldQueries';
import type { GameState } from './types';

export function getSafePathToTile(state: GameState, target: HexCoord) {
  if (state.gameOver || state.combat) return null;

  const start = state.player.coord;
  const targetDistance = hexDistance(start, target);
  if (targetDistance === 0) return [];
  if (targetDistance > state.radius) return null;
  if (targetDistance > WORLD_REVEAL_RADIUS) return null;

  const visited = new Set([hexKey(start)]);
  const queue: Array<{ coord: HexCoord; path: HexCoord[] }> = [
    { coord: start, path: [] },
  ];

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;

    for (const neighbor of hexNeighbors(next.coord)) {
      if (hexDistance(start, neighbor) > state.radius) continue;
      if (hexDistance(start, neighbor) > WORLD_REVEAL_RADIUS) continue;

      const key = hexKey(neighbor);
      if (visited.has(key)) continue;
      visited.add(key);

      const tile = getTileAt(state, neighbor);
      if (!isPassable(tile.terrain)) continue;
      if (
        (neighbor.q !== target.q || neighbor.r !== target.r) &&
        getHostileEnemyIds(state, neighbor).length > 0
      ) {
        continue;
      }

      const path = [...next.path, neighbor];
      if (neighbor.q === target.q && neighbor.r === target.r) {
        return path;
      }

      queue.push({ coord: neighbor, path });
    }
  }

  return null;
}
