import { describe, expect, it } from 'vitest';

import {
  GAME_CONFIG,
  pickBloodMoonItemKind,
  pickWorldGeneratedItemKind,
} from './config';
import { createGame } from './state';
import { spawnDebugEnemyNearby } from './stateDebug';
import { ensureTileState, resolveLootOutcomeRoll } from './world';
import { buildRegularTile } from './worldTileGeneration';
import { pickTerrain } from './worldTerrain';

describe('world loot roll mapping', () => {
  it('maps world-generated item kinds to equal random buckets', () => {
    expect(pickWorldGeneratedItemKind(0.0)).toBe('artifact');
    expect(pickWorldGeneratedItemKind(0.2)).toBe('weapon');
    expect(pickWorldGeneratedItemKind(0.4)).toBe('offhand');
    expect(pickWorldGeneratedItemKind(0.6)).toBe('armor');
    expect(pickWorldGeneratedItemKind(0.8)).toBe('consumable');
  });

  it('maps blood moon item kinds to equal random buckets', () => {
    expect(pickBloodMoonItemKind(0.0)).toBe('artifact');
    expect(pickBloodMoonItemKind(0.25)).toBe('weapon');
    expect(pickBloodMoonItemKind(0.5)).toBe('offhand');
    expect(pickBloodMoonItemKind(0.75)).toBe('armor');
  });

  it('inverts loot rolls into deterministic outcome rolls', () => {
    expect(resolveLootOutcomeRoll(0.01)).toBeCloseTo(0.99);
    expect(resolveLootOutcomeRoll(0.35)).toBeCloseTo(0.65);
  });

  it('builds tiles with no loot by default', () => {
    const seed = 'passive-loot-gone';
    const coords = [
      { q: 0, r: 0 },
      { q: 1, r: -2 },
      { q: -3, r: 4 },
      { q: 7, r: -5 },
    ];

    for (const coord of coords) {
      const terrain = pickTerrain(seed, coord);
      const tile = buildRegularTile(seed, coord, terrain);
      expect(tile.items).toEqual([]);
    }
  });

  it('does not rebuild a resolved debug spawn into a treasure goblin after enemy-state loss', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      const game = createGame(3, 'debug-rebuild-seed');
      game.player.coord = { q: 0, r: 0 };
      const next = spawnDebugEnemyNearby(game, {
        enemyTypeId: 'wolf',
        rarity: 'common',
      });
      const spawnedEnemy = Object.values(next.enemies).find(
        (enemy) =>
          enemy.enemyTypeId === 'wolf' &&
          (enemy.coord.q !== 0 || enemy.coord.r !== 0),
      );

      expect(spawnedEnemy).toBeDefined();
      delete next.enemies[spawnedEnemy!.id];

      ensureTileState(next, spawnedEnemy!.coord);

      expect(next.enemies[spawnedEnemy!.id]?.enemyTypeId).not.toBe(
        'treasure-goblin',
      );
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });

  it('does not promote unresolved hostile tiles into treasure goblins during generic materialization', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      let targetCoord: { q: number; r: number } | null = null;

      for (let q = -8; q <= 8 && !targetCoord; q += 1) {
        for (let r = -8; r <= 8; r += 1) {
          const coord = { q, r };
          const tile = buildRegularTile(
            'ensure-tile-state-no-goblin',
            coord,
            pickTerrain('ensure-tile-state-no-goblin', coord),
          );
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

      const game = createGame(3, 'ensure-tile-state-no-goblin');
      ensureTileState(game, targetCoord!);

      const enemyId =
        game.tiles[`${targetCoord!.q},${targetCoord!.r}`]?.enemyIds[0];
      expect(enemyId).toBeDefined();
      expect(game.enemies[enemyId!]?.enemyTypeId).not.toBe('treasure-goblin');
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });
});
