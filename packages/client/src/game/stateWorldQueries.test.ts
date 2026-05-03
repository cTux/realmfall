import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from './config';
import { createGame } from './state';
import { makePlayerClaim } from './territories';
import {
  getEnemiesAt,
  getPlayerClaimedTiles,
  getResolvedTileAt,
} from './stateWorldQueries';
import { buildTile } from './world';

describe('stateWorldQueries', () => {
  it('reuses claimed-tile scans while the tiles container is unchanged', () => {
    const game = createGame(3, 'claimed-tiles-cache-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: makePlayerClaim(),
    };

    const firstLookup = getPlayerClaimedTiles(game);
    const secondLookup = getPlayerClaimedTiles({ tiles: game.tiles });

    expect(secondLookup).toBe(firstLookup);
    expect(secondLookup).toHaveLength(1);
  });

  it('rebuilds the claimed-tile list when the tiles container changes', () => {
    const game = createGame(3, 'claimed-tiles-cache-refresh-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: makePlayerClaim(),
    };

    const firstLookup = getPlayerClaimedTiles(game);
    const nextTiles = {
      ...game.tiles,
      '1,0': {
        ...game.tiles['1,0'],
        claim: makePlayerClaim(),
      },
    };

    const secondLookup = getPlayerClaimedTiles({ tiles: nextTiles });

    expect(secondLookup).not.toBe(firstLookup);
    expect(secondLookup).toHaveLength(2);
  });

  it('returns null for unresolved coordinates without generating a tile', () => {
    const game = createGame(3, 'resolved-tile-only-query');

    expect(getResolvedTileAt(game, { q: 6, r: -3 })).toBeNull();
    expect(game.tiles['6,-3']).toBeUndefined();
  });

  it('can resolve an unresolved ordinary hostile tile into a treasure goblin', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      let targetCoord: { q: number; r: number } | null = null;

      for (let q = -8; q <= 8 && !targetCoord; q += 1) {
        for (let r = -8; r <= 8; r += 1) {
          const coord = { q, r };
          const tile = buildTile('state-world-query-treasure-goblin', coord);
          if (
            tile.structure === undefined &&
            tile.enemyIds.length === 1 &&
            tile.claim?.npc === undefined
          ) {
            targetCoord = coord;
            break;
          }
        }
      }

      expect(targetCoord).not.toBeNull();
      const enemies = getEnemiesAt(
        {
          seed: 'state-world-query-treasure-goblin',
          bloodMoonActive: false,
          enemies: {},
          tiles: {},
        },
        targetCoord!,
      );

      expect(enemies[0]?.enemyTypeId).toBe('treasure-goblin');
      expect(enemies[0]?.rarity).toBe('legendary');
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });

  it('does not apply the treasure goblin override when reconstructing faction NPCs', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      const enemies = getEnemiesAt(
        {
          seed: 'state-world-query-faction-npc',
          bloodMoonActive: false,
          enemies: {},
          tiles: {
            '3,-2': {
              coord: { q: 3, r: -2 },
              terrain: 'plains',
              items: [],
              enemyIds: ['enemy-3,-2-0'],
              claim: {
                ownerId: 'faction-1',
                ownerType: 'faction',
                ownerName: 'Valewatch',
                borderColor: '#ffffff',
                npc: {
                  name: 'Quartermaster Pell',
                  enemyId: 'enemy-3,-2-0',
                },
              },
            },
          },
        },
        { q: 3, r: -2 },
      );

      expect(enemies[0]?.enemyTypeId).not.toBe('treasure-goblin');
      expect(enemies[0]?.name).toBe('Quartermaster Pell');
      expect(enemies[0]?.aggressive).toBe(false);
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });
});
