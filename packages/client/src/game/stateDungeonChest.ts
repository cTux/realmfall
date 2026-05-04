import { hexKey } from './hex';
import { getActiveWorld } from './dungeons/worldState';
import {
  markDungeonCleared,
  markDungeonEliteDefeated,
} from './stateDungeonActions';
import { cloneForWorldMutation } from './stateMutationHelpers';
import type { GameState } from './types';

export function openDungeonChest(state: GameState): GameState {
  const next = cloneForWorldMutation(state);
  const activeWorld = getActiveWorld(next);
  if (activeWorld?.kind !== 'dungeon') {
    return next;
  }

  const currentTile = next.tiles[hexKey(next.player.coord)];
  if (currentTile?.structure !== 'dungeon-chest') {
    return next;
  }

  if (
    activeWorld.enemies[activeWorld.dungeon.finalEliteEnemyId] ||
    !markDungeonEliteDefeated(next, activeWorld.id)
  ) {
    return next;
  }

  markDungeonCleared(next, activeWorld.id);
  return next;
}
