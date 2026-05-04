import { describe, expect, it } from 'vitest';
import { hexDistance } from '../../hex';
import { isPassableTerrain } from '../../worldTerrain';
import { generateDungeonWorld } from './generateDungeonWorld';

describe('generateDungeonWorld', () => {
  it('builds a deterministic padded dungeon with 200+ passable tiles and a final chest', () => {
    const world = generateDungeonWorld({
      dungeonId: 'dungeon:generator:1,0',
      gameRadius: 6,
      seed: 'generator-seed',
      surfaceCoord: { q: 1, r: 0 },
    });

    const passableTiles = Object.values(world.tiles).filter((tile) =>
      isPassableTerrain(tile.terrain),
    );
    const chestTile = Object.values(world.tiles).find(
      (tile) => tile.structure === 'dungeon-chest',
    );
    const finalElite = world.enemies[world.dungeon.finalEliteEnemyId];

    expect(passableTiles.length).toBeGreaterThanOrEqual(200);
    expect(world.tiles['0,0']?.structure).toBe('dungeon');
    expect(finalElite?.elite).toBe(true);
    expect(chestTile?.coord).toEqual(world.dungeon.finalChestCoord);
    expect(
      hexDistance(world.dungeon.entranceCoord, world.dungeon.finalChestCoord),
    ).toBeGreaterThanOrEqual(8);
    expect(
      hexDistance(
        world.dungeon.finalChestCoord,
        finalElite?.coord ?? { q: 0, r: 0 },
      ),
    ).toBeLessThanOrEqual(2);

    const repeat = generateDungeonWorld({
      dungeonId: 'dungeon:generator:1,0',
      gameRadius: 6,
      seed: 'generator-seed',
      surfaceCoord: { q: 1, r: 0 },
    });

    expect(repeat).toEqual(world);
  });

  it('uses wall terrain from the selected theme around the playable footprint', () => {
    const world = generateDungeonWorld({
      dungeonId: 'dungeon:generator:2,-1',
      gameRadius: 6,
      seed: 'generator-wall-seed',
      surfaceCoord: { q: 2, r: -1 },
    });

    const wallTiles = Object.values(world.tiles).filter((tile) =>
      tile.terrain.endsWith('-wall'),
    );

    expect(wallTiles.length).toBeGreaterThan(0);
    expect(
      wallTiles.every((tile) => isPassableTerrain(tile.terrain) === false),
    ).toBe(true);
  });
});
