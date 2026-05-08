import { describe, expect, it } from 'vitest';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from './stateDungeonEnemyMovementTestkit';
import { makeEnemy } from './combat';
import { createDungeonWorldState } from './dungeons/worldState';
import { hexKey, type HexCoord } from './hex';
import { syncCombatEncounterEnemies } from './stateCombatEncounterSync';
import { createGame } from './stateFactory';
import { syncPlayerStatusEffects } from './stateWorldClock';
import { setActiveWorld } from './dungeons/worldState';
import type { Enemy, Tile } from './types';

const ENTRANCE_COORD = { q: 0, r: 0 };
const CHEST_COORD = { q: 0, r: 1 };

describe('dungeon enemy world movement', () => {
  it('wanders around the spawn point on the same cooldown as player movement', () => {
    const enemyId = 'patrol-enemy';
    const game = createDungeonMovementGame({
      enemies: [
        makeDungeonEnemy({
          coord: { q: 4, r: 0 },
          enemyId,
        }),
        makeDungeonEnemy({
          coord: { q: 0, r: 2 },
          enemyId: 'final-guard',
          rarity: 'legendary',
        }),
      ],
      passableCoords: [
        ENTRANCE_COORD,
        { q: 1, r: 0 },
        { q: 2, r: 0 },
        { q: 3, r: 0 },
        { q: 4, r: 0 },
        CHEST_COORD,
        { q: 0, r: 2 },
      ],
      playerCoord: ENTRANCE_COORD,
    });

    const moved = syncPlayerStatusEffects(game, WORLD_MOVE_HEX_COOLDOWN_MS);

    expect(moved.enemies[enemyId]?.coord).toEqual({ q: 3, r: 0 });
    expect(moved.enemies[enemyId]?.dungeonSpawnCoord).toEqual({ q: 4, r: 0 });
    expect(moved.enemies[enemyId]?.dungeonMovementCooldownEndsAt).toBe(
      WORLD_MOVE_HEX_COOLDOWN_MS * 2,
    );

    const coolingDown = syncPlayerStatusEffects(
      moved,
      WORLD_MOVE_HEX_COOLDOWN_MS + 500,
    );

    expect(coolingDown.enemies[enemyId]?.coord).toEqual({ q: 3, r: 0 });
  });

  it('chases the player from two hexes away and starts combat on contact', () => {
    const enemyId = 'chasing-enemy';
    const game = createDungeonMovementGame({
      enemies: [
        makeDungeonEnemy({
          coord: { q: 2, r: 0 },
          enemyId,
        }),
        makeDungeonEnemy({
          coord: { q: 0, r: 2 },
          enemyId: 'final-guard',
          rarity: 'legendary',
        }),
      ],
      passableCoords: [
        ENTRANCE_COORD,
        { q: 1, r: 0 },
        { q: 2, r: 0 },
        CHEST_COORD,
        { q: 0, r: 2 },
      ],
      playerCoord: ENTRANCE_COORD,
    });

    const firstStep = syncPlayerStatusEffects(game, WORLD_MOVE_HEX_COOLDOWN_MS);

    expect(firstStep.enemies[enemyId]?.coord).toEqual({ q: 1, r: 0 });
    expect(firstStep.combat).toBeNull();

    const secondStep = syncPlayerStatusEffects(
      firstStep,
      WORLD_MOVE_HEX_COOLDOWN_MS * 2,
    );

    expect(secondStep.enemies[enemyId]?.coord).toEqual({ q: 1, r: 0 });
    expect(secondStep.tiles['0,0']?.enemyIds).not.toContain(enemyId);
    expect(secondStep.tiles['1,0']?.enemyIds).toContain(enemyId);
    expect(secondStep.combat?.coord).toEqual(ENTRANCE_COORD);
    expect(secondStep.combat?.enemyIds).toEqual([enemyId]);
    expect(secondStep.combat?.started).toBe(false);
    expect(secondStep.combat?.startedAtMs).toBeUndefined();
    expect(secondStep.combat?.engagement).toMatchObject({
      autoStepOnVictory: false,
      engageMode: 'enemy-chase',
      stagingCoord: { q: 0, r: 0 },
      targetCoord: { q: 1, r: 0 },
    });
  });

  it('keeps the player on the staging hex after winning a roaming chase encounter', () => {
    const enemyId = 'chasing-enemy';
    const game = createDungeonMovementGame({
      enemies: [
        makeDungeonEnemy({
          coord: { q: 2, r: 0 },
          enemyId,
        }),
        makeDungeonEnemy({
          coord: { q: 0, r: 2 },
          enemyId: 'final-guard',
          rarity: 'legendary',
        }),
      ],
      passableCoords: [
        ENTRANCE_COORD,
        { q: 1, r: 0 },
        { q: 2, r: 0 },
        CHEST_COORD,
        { q: 0, r: 2 },
      ],
      playerCoord: ENTRANCE_COORD,
    });

    const firstStep = syncPlayerStatusEffects(game, WORLD_MOVE_HEX_COOLDOWN_MS);
    const chaseCombat = syncPlayerStatusEffects(
      firstStep,
      WORLD_MOVE_HEX_COOLDOWN_MS * 2,
    );

    delete chaseCombat.enemies[enemyId];

    syncCombatEncounterEnemies(chaseCombat);

    expect(chaseCombat.combat).toBeNull();
    expect(chaseCombat.player.coord).toEqual(ENTRANCE_COORD);
  });

  it('uses a passable chase path around walls instead of freezing on a blocked direct line', () => {
    const enemyId = 'wall-chaser';
    const game = createDungeonMovementGame({
      enemies: [
        makeDungeonEnemy({
          coord: { q: 2, r: 0 },
          enemyId,
        }),
        makeDungeonEnemy({
          coord: { q: 0, r: 3 },
          enemyId: 'final-guard',
          rarity: 'legendary',
        }),
      ],
      passableCoords: [
        ENTRANCE_COORD,
        { q: 2, r: 0 },
        { q: 2, r: -1 },
        { q: 1, r: -1 },
        CHEST_COORD,
        { q: 0, r: 2 },
        { q: 0, r: 3 },
      ],
      playerCoord: ENTRANCE_COORD,
    });

    const chased = syncPlayerStatusEffects(game, WORLD_MOVE_HEX_COOLDOWN_MS);

    expect(chased.enemies[enemyId]?.coord).toEqual({ q: 2, r: -1 });
    expect(chased.combat).toBeNull();
  });

  it('keeps the final chest guard stationary even when it has an open move', () => {
    const finalGuardId = 'final-guard';
    const game = createDungeonMovementGame({
      enemies: [
        makeDungeonEnemy({
          coord: { q: 0, r: 2 },
          enemyId: finalGuardId,
          rarity: 'legendary',
        }),
      ],
      passableCoords: [
        ENTRANCE_COORD,
        CHEST_COORD,
        { q: 0, r: 2 },
        { q: 1, r: 2 },
      ],
      playerCoord: { q: 4, r: 0 },
      finalEliteEnemyId: finalGuardId,
    });

    const synced = syncPlayerStatusEffects(game, WORLD_MOVE_HEX_COOLDOWN_MS);

    expect(synced.enemies[finalGuardId]?.coord).toEqual({ q: 0, r: 2 });
    expect(synced.enemies[finalGuardId]?.dungeonMovementCooldownEndsAt).toBe(
      undefined,
    );
  });
});

function createDungeonMovementGame({
  enemies,
  passableCoords,
  playerCoord,
  finalEliteEnemyId = 'final-guard',
}: {
  enemies: Enemy[];
  passableCoords: HexCoord[];
  playerCoord: HexCoord;
  finalEliteEnemyId?: string;
}) {
  const game = createGame(6, 'dungeon-enemy-movement');
  const dungeonId = 'dungeon:dungeon-enemy-movement:1,0';
  const tiles = Object.fromEntries(
    passableCoords.map((coord) => [hexKey(coord), makeDungeonTile(coord)]),
  ) as Record<string, Tile>;

  tiles[hexKey(ENTRANCE_COORD)] = {
    ...tiles[hexKey(ENTRANCE_COORD)],
    structure: 'dungeon',
  };
  tiles[hexKey(CHEST_COORD)] = {
    ...tiles[hexKey(CHEST_COORD)],
    structure: 'dungeon-chest',
  };

  const dungeonEnemies = Object.fromEntries(
    enemies.map((enemy) => [enemy.id, enemy]),
  ) as Record<string, Enemy>;

  enemies.forEach((enemy) => {
    tiles[hexKey(enemy.coord)]?.enemyIds.push(enemy.id);
  });

  game.worlds[dungeonId] = createDungeonWorldState({
    id: dungeonId,
    tiles,
    enemies: dungeonEnemies,
    dungeon: {
      cleared: false,
      entranceCoord: { ...ENTRANCE_COORD },
      finalChestCoord: { ...CHEST_COORD },
      finalEliteEnemyId,
      paddingRadius: 1,
      surfaceEntranceCoord: { q: 1, r: 0 },
      templateId: 'rooms-and-corridors',
      themeId: 'brick-halls',
    },
  });
  game.activeDungeon = {
    dungeonId,
    returnCoord: { q: 1, r: 0 },
    surfaceCoord: { q: 1, r: 0 },
  };
  game.player.coord = { ...playerCoord };

  return setActiveWorld(game, dungeonId);
}

function makeDungeonEnemy({
  coord,
  enemyId,
  rarity = 'uncommon',
}: {
  coord: HexCoord;
  enemyId: string;
  rarity?: NonNullable<Enemy['rarity']>;
}) {
  const enemy = makeEnemy(
    'dungeon-enemy-movement',
    coord,
    'dungeon-brick-floor',
    0,
    'dungeon',
    false,
    {
      enemyId,
      rarity,
    },
  );

  return {
    ...enemy,
    dungeonSpawnCoord: { ...coord },
  } satisfies Enemy;
}

function makeDungeonTile(coord: HexCoord): Tile {
  return {
    coord,
    terrain: 'dungeon-brick-floor',
    items: [],
    enemyIds: [],
  };
}
