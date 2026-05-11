import { hexKey, hexesInRange } from '@realmfall/core/game/hex';
import { createGame } from '@realmfall/core/game/stateFactory';
import type { Tile } from '@realmfall/core/game/stateTypes';
import { hydrateResolvedWorldTilePayload } from '@realmfall/core/game/worldTileResolutionRuntime';
import {
  mergeResolvedWorldTilePayloads,
  createVisibleWorldResolutionState,
  syncTileResolutionCoordinator,
} from './useWorldTileResolutionLifecycleTestkit';

describe('useWorldTileResolutionLifecycle helpers', () => {
  it('merges resolved payloads through the active-world aliases', () => {
    const current = createGame(2, 'tile-resolution-merge-aliases');
    const resolvedEnemy = {
      id: 'resolved-enemy',
      name: 'Resolved enemy',
      coord: { q: 1, r: 0 },
      hp: 5,
      maxHp: 5,
      tier: 1,
      xp: 3,
      elite: false,
      level: 1,
      attack: 1,
      defense: 0,
      mana: 0,
      maxMana: 0,
      speed: 1,
      loot: [],
      icon: 'enemy-wolf',
      isHostile: true,
      statusEffects: [],
    };

    const next = mergeResolvedWorldTilePayloads({
      current,
      hydrateResolvedWorldTilePayload,
      payloads: [
        {
          coord: { q: 1, r: 0 },
          tile: {
            coord: { q: 1, r: 0 },
            terrain: 'plains',
            items: [],
            enemyIds: [resolvedEnemy.id],
          },
          enemies: [resolvedEnemy],
        },
      ],
    });

    expect(next).not.toBe(current);
    expect(next.tiles).toBe(next.worlds[next.activeWorldId].tiles);
    expect(next.enemies).toBe(next.worlds[next.activeWorldId].enemies);
    expect(next.tiles['1,0']).toMatchObject({
      coord: { q: 1, r: 0 },
      enemyIds: [resolvedEnemy.id],
      terrain: 'plains',
    });
    expect(next.enemies[resolvedEnemy.id]).toMatchObject({
      coord: resolvedEnemy.coord,
      defense: resolvedEnemy.defense,
      hp: resolvedEnemy.hp,
      id: resolvedEnemy.id,
      mana: resolvedEnemy.mana,
      maxHp: resolvedEnemy.maxHp,
      maxMana: resolvedEnemy.maxMana,
      name: resolvedEnemy.name,
      statusEffects: [],
    });
  });

  it('syncs the coordinator with the visible world resolution state', async () => {
    const game = createGame(2, 'tile-resolution-sync-state');
    const syncVisibleCoords = vi.fn().mockResolvedValue(undefined);
    const payload = createVisibleWorldResolutionState(game, game.player.coord);

    await syncTileResolutionCoordinator(
      { dispose: vi.fn(), syncVisibleCoords },
      payload,
    );

    expect(syncVisibleCoords).toHaveBeenCalledWith(payload);
  });

  it('builds a narrowed sync payload for visible frontier inputs', () => {
    const game = createGame(2, 'tile-resolution-sync-state');
    const playerCoord = { q: 1, r: 0 };
    const offscreenCoord = {
      q: playerCoord.q + game.radius + 1,
      r: playerCoord.r,
    };
    const offscreenTile = {
      coord: offscreenCoord,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    } satisfies Tile;
    const gameWithOffscreenTile = {
      ...game,
      tiles: {
        ...game.tiles,
        [hexKey(offscreenCoord)]: offscreenTile,
      },
    };
    const visibleKeys = new Set(
      hexesInRange(playerCoord, game.radius).map((coord) => hexKey(coord)),
    );
    const resolvedTileKeys = Object.keys(gameWithOffscreenTile.tiles);
    const expectedResolvedTileKeys = resolvedTileKeys
      .filter((key) => visibleKeys.has(key))
      .sort();
    const offscreenTileKeys = resolvedTileKeys.filter(
      (key) => !visibleKeys.has(key),
    );

    expect(offscreenTileKeys.length).toBeGreaterThan(0);

    const payload = createVisibleWorldResolutionState(
      gameWithOffscreenTile,
      playerCoord,
    );
    const expectedKeys = Object.keys(payload).sort();

    expect(payload).toMatchObject({
      bloodMoonActive: game.bloodMoonActive,
      playerCoord,
      radius: game.radius,
      seed: game.seed,
    });
    expect(payload.resolvedTiles).not.toBe(gameWithOffscreenTile.tiles);
    expect(Object.keys(payload.resolvedTiles).sort()).toStrictEqual(
      expectedResolvedTileKeys,
    );
    expect(
      Object.keys(payload.resolvedTiles).every((key) => visibleKeys.has(key)),
    ).toBe(true);
    expect(expectedKeys).toStrictEqual([
      'bloodMoonActive',
      'playerCoord',
      'radius',
      'resolvedTiles',
      'seed',
    ]);
    expect(payload).not.toHaveProperty('player');
  });
});
