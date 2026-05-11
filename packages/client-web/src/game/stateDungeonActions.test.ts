import { describe, expect, it } from 'vitest';
import { hexKey } from './hex';
import { createGame } from './stateFactory';
import { respawnAtNearestTown } from './stateSurvival';
import { openDungeonChest } from './stateDungeonChest';
import {
  activateDungeonWorld,
  leaveDungeonWorld,
} from './stateDungeonActionsTestkit';
import type { GameState } from './types';

function seedSurfaceDungeonEntrance(seed = 'dungeon-gameplay-flow') {
  const game = createGame(3, seed);
  const surfaceCoord = { q: 1, r: 0 };
  game.player.coord = surfaceCoord;
  game.tiles[hexKey(surfaceCoord)] = {
    coord: surfaceCoord,
    terrain: 'plains',
    structure: 'dungeon',
    items: [],
    enemyIds: [],
  };

  return { game, surfaceCoord };
}

function removeDungeonEnemy(
  game: ReturnType<typeof createGame>,
  dungeonId: string,
  enemyId: string,
) {
  const world = game.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    throw new Error('Expected an active dungeon world.');
  }

  delete world.enemies[enemyId];
  Object.values(world.tiles).forEach((tile) => {
    tile.enemyIds = tile.enemyIds.filter(
      (currentEnemyId) => currentEnemyId !== enemyId,
    );
  });
}

function getDungeonWorld(game: GameState, dungeonId: string) {
  const world = game.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    throw new Error('Expected a dungeon world.');
  }

  return world;
}

describe('stateDungeonActions', () => {
  it('enters and leaves the same persistent dungeon instance', () => {
    const { game, surfaceCoord } = seedSurfaceDungeonEntrance(
      'dungeon-enter-leave',
    );

    const entered = activateDungeonWorld(game);
    const dungeonId = entered.activeDungeon?.dungeonId;

    expect(dungeonId).toBe(`dungeon:${entered.seed}:${hexKey(surfaceCoord)}`);
    expect(entered.activeWorldId).toBe(dungeonId);
    expect(entered.player.coord).toEqual({ q: 0, r: 0 });
    expect(entered.worlds[dungeonId!]?.kind).toBe('dungeon');

    const world = entered.worlds[dungeonId!];
    expect(world?.tiles['0,0']?.structure).toBe('dungeon');
    world!.tiles['0,0']!.items.push({
      id: 'persistent-loot',
      itemKey: 'gold',
      name: 'Gold',
      quantity: 5,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const left = leaveDungeonWorld(entered);
    expect(left.activeWorldId).toBe(left.surfaceWorldId);
    expect(left.activeDungeon).toBeNull();
    expect(left.player.coord).toEqual(surfaceCoord);

    const reentered = activateDungeonWorld(left);
    expect(reentered.activeDungeon?.dungeonId).toBe(dungeonId);
    expect(reentered.worlds[dungeonId!]?.tiles['0,0']?.items).toEqual([
      expect.objectContaining({ id: 'persistent-loot' }),
    ]);
  });

  it('keeps dungeon progress after death and respawns on the surface', () => {
    const { game } = seedSurfaceDungeonEntrance(
      'dungeon-death-preserves-progress',
    );
    const entered = activateDungeonWorld(game);
    const dungeonId = entered.activeDungeon!.dungeonId;
    const world = getDungeonWorld(entered, dungeonId);
    const progressEnemyId = Object.keys(entered.enemies).find(
      (enemyId) => enemyId !== world.dungeon.finalEliteEnemyId,
    );

    expect(progressEnemyId).toBeDefined();
    removeDungeonEnemy(entered, dungeonId, progressEnemyId!);

    entered.player.hp = 0;
    respawnAtNearestTown(entered, entered.player.coord);

    expect(entered.activeWorldId).toBe(entered.surfaceWorldId);
    expect(entered.activeDungeon).toBeNull();
    expect(entered.player.coord).toEqual(entered.homeHex);
    expect(
      entered.worlds[dungeonId]?.enemies[progressEnemyId!],
    ).toBeUndefined();
  });

  it('requires the final elite before the dungeon chest can clear the instance', () => {
    const { game } = seedSurfaceDungeonEntrance('dungeon-chest-gate');
    const entered = activateDungeonWorld(game);
    const dungeonId = entered.activeDungeon!.dungeonId;
    const world = getDungeonWorld(entered, dungeonId);

    entered.player.coord = { ...world.dungeon.finalChestCoord };
    const blocked = openDungeonChest(entered);

    expect(blocked.worlds[dungeonId]?.kind).toBe('dungeon');
    expect(getDungeonWorld(blocked, dungeonId).dungeon.cleared).toBe(false);
    expect(
      blocked.worlds[dungeonId]!.tiles[hexKey(world.dungeon.finalChestCoord)]
        ?.structure,
    ).toBe('dungeon-chest');

    removeDungeonEnemy(blocked, dungeonId, world.dungeon.finalEliteEnemyId);
    blocked.player.coord = { ...world.dungeon.finalChestCoord };

    const cleared = openDungeonChest(blocked);

    expect(getDungeonWorld(cleared, dungeonId).dungeon.cleared).toBe(true);
    expect(
      Object.keys(getDungeonWorld(cleared, dungeonId).enemies),
    ).toHaveLength(0);
    expect(
      cleared.worlds[dungeonId]!.tiles[hexKey(world.dungeon.finalChestCoord)]
        ?.structure,
    ).toBeUndefined();
  });

  it('re-enters a cleared dungeon as the same empty retired instance', () => {
    const { game } = seedSurfaceDungeonEntrance('dungeon-retired-instance');
    const entered = activateDungeonWorld(game);
    const dungeonId = entered.activeDungeon!.dungeonId;
    const world = getDungeonWorld(entered, dungeonId);

    removeDungeonEnemy(entered, dungeonId, world.dungeon.finalEliteEnemyId);
    entered.player.coord = { ...world.dungeon.finalChestCoord };
    const cleared = openDungeonChest(entered);

    const left = leaveDungeonWorld(cleared);
    const reentered = activateDungeonWorld(left);

    expect(reentered.activeDungeon?.dungeonId).toBe(dungeonId);
    expect(getDungeonWorld(reentered, dungeonId).dungeon.cleared).toBe(true);
    expect(
      Object.keys(getDungeonWorld(reentered, dungeonId).enemies),
    ).toHaveLength(0);
    expect(
      reentered.worlds[dungeonId]!.tiles[hexKey(world.dungeon.finalChestCoord)]
        ?.structure,
    ).toBeUndefined();
  });

  it('grants chest loot before retiring the cleared dungeon', () => {
    const { game } = seedSurfaceDungeonEntrance('dungeon-chest-loot');
    const entered = activateDungeonWorld(game);
    const dungeonId = entered.activeDungeon!.dungeonId;
    const world = getDungeonWorld(entered, dungeonId);
    const inventoryIds = new Set(
      entered.player.inventory.map((item) => item.id),
    );

    removeDungeonEnemy(entered, dungeonId, world.dungeon.finalEliteEnemyId);
    entered.player.coord = { ...world.dungeon.finalChestCoord };

    const cleared = openDungeonChest(entered);
    const newLoot = cleared.player.inventory.find(
      (item) => !inventoryIds.has(item.id),
    );

    expect(newLoot).toBeDefined();
    expect(getDungeonWorld(cleared, dungeonId).dungeon.cleared).toBe(true);
  });
});
