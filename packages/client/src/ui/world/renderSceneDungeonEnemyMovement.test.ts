import { describe, expect, it } from 'vitest';
import { makeEnemy } from '../../game/combat';
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../game/config';
import {
  createDungeonWorldState,
  setActiveWorld,
} from '../../game/dungeons/worldState';
import { hexKey, type HexCoord } from '../../game/hex';
import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import type { Enemy, Tile } from '../../game/stateTypes';
import {
  collectDescendants,
  createMockApp,
  getBadgeLayer,
  MockGraphics,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene dungeon enemy movement', () => {
  it('draws a movement cooldown bar for a visible roaming dungeon enemy', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createDungeonRenderGame();
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        worldTimeMs: 500,
      } as never,
    );

    const badgeGraphics = collectDescendants(getBadgeLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );

    expect(
      badgeGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
        ),
      ),
    ).toBe(true);
  });

  it('does not draw a movement cooldown bar for a fogged outgoing dungeon tile during transition', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createFoggedOutgoingDungeonRenderGame();
    const app = createMockApp(960, 720);

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 500,
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          nowMs: 0,
          outgoingTiles: [game.tiles['-6,0']!],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const badgeGraphics = collectDescendants(getBadgeLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );

    expect(
      badgeGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
        ),
      ),
    ).toBe(false);
  });
});

function createDungeonRenderGame() {
  const game = createGame(4, 'render-scene-dungeon-enemy-movement');
  const dungeonId = 'dungeon:render-scene-dungeon-enemy-movement:1,0';
  const enemyCoord = { q: 1, r: 0 };
  const tiles = Object.fromEntries(
    [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: 0, r: 2 },
    ].map((coord) => [hexKey(coord), makeDungeonTile(coord)]),
  ) as Record<string, Tile>;

  tiles['0,0']!.structure = 'dungeon';
  tiles['0,1']!.structure = 'dungeon-chest';

  const enemy = makeEnemy(
    'render-scene-dungeon-enemy-movement',
    enemyCoord,
    'dungeon-brick-floor',
    0,
    'dungeon',
    false,
    {
      enemyId: 'dungeon-roamer',
      rarity: 'rare',
    },
  );
  enemy.dungeonSpawnCoord = { ...enemyCoord };
  enemy.dungeonMovementCooldownEndsAt = WORLD_MOVE_HEX_COOLDOWN_MS + 500;
  tiles[hexKey(enemyCoord)]!.enemyIds.push(enemy.id);

  game.worlds[dungeonId] = createDungeonWorldState({
    id: dungeonId,
    tiles,
    enemies: {
      [enemy.id]: enemy,
      'final-guard': {
        ...makeEnemy(
          'render-scene-dungeon-enemy-movement',
          { q: 0, r: 2 },
          'dungeon-brick-floor',
          0,
          'dungeon',
          false,
          {
            enemyId: 'final-guard',
            rarity: 'legendary',
          },
        ),
        dungeonSpawnCoord: { q: 0, r: 2 },
      } satisfies Enemy,
    },
    dungeon: {
      cleared: false,
      entranceCoord: { q: 0, r: 0 },
      finalChestCoord: { q: 0, r: 1 },
      finalEliteEnemyId: 'final-guard',
      paddingRadius: 1,
      surfaceEntranceCoord: { q: 1, r: 0 },
      templateId: 'rooms-and-corridors',
      themeId: 'brick-halls',
    },
  });
  game.player.coord = { q: 0, r: 0 };

  return setActiveWorld(game, dungeonId);
}

function createFoggedOutgoingDungeonRenderGame() {
  const game = createGame(6, 'render-scene-dungeon-enemy-fogged-cooldown');
  const dungeonId = 'dungeon:render-scene-dungeon-enemy-fogged-cooldown:1,0';
  const fogEnemyCoord = { q: -6, r: 0 };
  const visibleCoords = [
    { q: 1, r: 0 },
    { q: 0, r: 0 },
    { q: 0, r: 1 },
    { q: 0, r: 2 },
    fogEnemyCoord,
  ];
  const tiles = Object.fromEntries(
    visibleCoords.map((coord) => [hexKey(coord), makeDungeonTile(coord)]),
  ) as Record<string, Tile>;

  tiles['0,0']!.structure = 'dungeon';
  tiles['0,1']!.structure = 'dungeon-chest';

  const fogEnemy = makeEnemy(
    'render-scene-dungeon-enemy-fogged-cooldown',
    fogEnemyCoord,
    'dungeon-brick-floor',
    0,
    'dungeon',
    false,
    {
      enemyId: 'fogged-dungeon-roamer',
      rarity: 'rare',
    },
  );
  fogEnemy.dungeonSpawnCoord = { ...fogEnemyCoord };
  fogEnemy.dungeonMovementCooldownEndsAt = WORLD_MOVE_HEX_COOLDOWN_MS + 500;
  tiles[hexKey(fogEnemyCoord)]!.enemyIds.push(fogEnemy.id);

  game.worlds[dungeonId] = createDungeonWorldState({
    id: dungeonId,
    tiles,
    enemies: {
      [fogEnemy.id]: fogEnemy,
      'final-guard': {
        ...makeEnemy(
          'render-scene-dungeon-enemy-fogged-cooldown',
          { q: 0, r: 2 },
          'dungeon-brick-floor',
          0,
          'dungeon',
          false,
          {
            enemyId: 'final-guard',
            rarity: 'legendary',
          },
        ),
        dungeonSpawnCoord: { q: 0, r: 2 },
      } satisfies Enemy,
    },
    dungeon: {
      cleared: false,
      entranceCoord: { q: 0, r: 0 },
      finalChestCoord: { q: 0, r: 1 },
      finalEliteEnemyId: 'final-guard',
      paddingRadius: 1,
      surfaceEntranceCoord: { q: 1, r: 0 },
      templateId: 'rooms-and-corridors',
      themeId: 'brick-halls',
    },
  });
  game.player.coord = { q: 1, r: 0 };

  return setActiveWorld(game, dungeonId);
}

function makeDungeonTile(coord: HexCoord): Tile {
  return {
    coord,
    terrain: 'dungeon-brick-floor',
    items: [],
    enemyIds: [],
  };
}
