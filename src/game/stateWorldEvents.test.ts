import {
  createGame,
  HARVEST_MOON_RESOURCE_TYPE_CHANCES,
  getEnemyAt,
  getTileAt,
  getVisibleTiles,
  moveToTile,
  progressCombat,
  startCombat,
  syncBloodMoon,
  takeAllTileItems,
  triggerEarthshake,
  type GameState,
} from './state';
import { makeEnemy } from './combat';
import { GAME_DAY_DURATION_MS } from './config';
import { hexDistance } from './hex';
import { getItemCategory } from './content/items';
import { createPlacedWorldBossEncounter } from './stateTestHelpers';

describe('game state world events', () => {
  it('can trigger a blood moon that weakens enemies and floods nearby tiles', () => {
    let bloodMoonGame = createGame(6, 'blood-moon-seed');
    bloodMoonGame.player.coord = { q: 4, r: -2 };
    bloodMoonGame.enemies['enemy-test'] = {
      id: 'enemy-test',
      name: 'Bandit',
      coord: { q: 5, r: -2 },
      tier: 4,
      hp: 32,
      maxHp: 32,
      attack: 9,
      defense: 5,
      xp: 20,
      elite: false,
    };

    for (let cycle = 0; cycle < 200; cycle += 1) {
      const candidate = { ...bloodMoonGame, bloodMoonCycle: cycle };
      const synced = syncBloodMoon(candidate, 18 * 60);
      if (synced.bloodMoonActive) {
        bloodMoonGame = synced;
        break;
      }
    }

    expect(bloodMoonGame.bloodMoonActive).toBe(true);
    expect(bloodMoonGame.bloodMoonCheckedTonight).toBe(true);
    expect(
      bloodMoonGame.logs.some((entry) => /blood moon begins/i.test(entry.text)),
    ).toBe(true);
    expect(bloodMoonGame.enemies['enemy-test']?.maxHp).toBe(3);
    expect(bloodMoonGame.enemies['enemy-test']?.attack).toBe(1);
    expect(bloodMoonGame.enemies['enemy-test']?.defense).toBe(1);

    const nearbyEnemyCount = Object.values(bloodMoonGame.enemies).filter(
      (enemy) =>
        enemy.id !== 'enemy-test' &&
        Math.max(
          Math.abs(enemy.coord.q - bloodMoonGame.player.coord.q),
          Math.abs(enemy.coord.r - bloodMoonGame.player.coord.r),
          Math.abs(
            -(enemy.coord.q - bloodMoonGame.player.coord.q) -
              (enemy.coord.r - bloodMoonGame.player.coord.r),
          ),
        ) <= 6,
    ).length;

    expect(nearbyEnemyCount).toBeGreaterThan(0);
    expect(
      Object.values(bloodMoonGame.tiles).every(
        (tile) => tile.enemyIds.length <= 3,
      ),
    ).toBe(true);

    const sunrise = syncBloodMoon(bloodMoonGame, 7 * 60);
    expect(sunrise.bloodMoonActive).toBe(false);
    expect(sunrise.bloodMoonCheckedTonight).toBe(false);
    expect(sunrise.bloodMoonCycle).toBe(bloodMoonGame.bloodMoonCycle + 1);
    expect(sunrise.enemies['enemy-test']?.maxHp).toBe(32);
    expect(sunrise.logs[0]?.text).toMatch(/blood moon ends/i);
  });

  it('does not let blood moon spawns stack more than three enemies on one tile', () => {
    const game = createGame(6, 'blood-moon-stack-cap');
    game.player.coord = { q: 0, r: 0 };
    game.bloodMoonCycle = 12;
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-1,0-0', 'enemy-1,0-1', 'enemy-1,0-2'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 3,
      elite: false,
    };
    game.enemies['enemy-1,0-1'] = {
      id: 'enemy-1,0-1',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 3,
      elite: false,
    };
    game.enemies['enemy-1,0-2'] = {
      id: 'enemy-1,0-2',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 3,
      elite: false,
    };

    const synced = syncBloodMoon(game, 18 * 60);

    expect(getTileAt(synced, { q: 1, r: 0 }).enemyIds).toHaveLength(3);
  });

  it('logs ordinary nightfall and morning transitions', () => {
    const game = createGame(3, 'day-phase-seed');
    game.dayPhase = 'day';

    const night = syncBloodMoon(game, 18 * 60);
    expect(night.dayPhase).toBe('night');
    expect(night.logs[0]?.text).toMatch(/night falls across the wilds/i);

    const morning = syncBloodMoon(night, 7 * 60);
    expect(morning.dayPhase).toBe('day');
    expect(
      morning.logs.some((entry) =>
        /morning breaks over the wilds/i.test(entry.text),
      ),
    ).toBe(true);
    expect(
      morning.logs.some((entry) => /blood moon ends/i.test(entry.text)),
    ).toBe(false);
  });

  it('can trigger a harvest moon that spawns gathering nodes nearby', () => {
    let harvestMoonGame = createGame(6, 'harvest-moon-seed');
    harvestMoonGame.player.coord = { q: 2, r: -1 };

    for (let cycle = 0; cycle < 200; cycle += 1) {
      const candidate = {
        ...harvestMoonGame,
        bloodMoonCycle: cycle,
        harvestMoonCycle: cycle,
        bloodMoonCheckedTonight: false,
        harvestMoonCheckedTonight: false,
        bloodMoonActive: false,
        harvestMoonActive: false,
      };
      const synced = syncBloodMoon(candidate, 18 * 60);
      if (synced.harvestMoonActive) {
        harvestMoonGame = synced;
        break;
      }
    }

    expect(harvestMoonGame.harvestMoonActive).toBe(true);
    expect(
      harvestMoonGame.logs.some((entry) =>
        /harvest moon rises/i.test(entry.text),
      ),
    ).toBe(true);
    expect(
      Object.values(harvestMoonGame.tiles).some(
        (tile) => tile.structure === 'herbs',
      ),
    ).toBe(true);
    expect(getTileAt(harvestMoonGame, harvestMoonGame.homeHex).structure).toBe(
      undefined,
    );

    const sunrise = syncBloodMoon(harvestMoonGame, 7 * 60);
    expect(sunrise.harvestMoonActive).toBe(false);
    expect(
      sunrise.logs.some((entry) => /harvest moon fades/i.test(entry.text)),
    ).toBe(true);
  });

  it('weights herbs three times in the harvest moon resource pool', () => {
    expect(HARVEST_MOON_RESOURCE_TYPE_CHANCES.herbs).toBeCloseTo(3 / 7);
    expect(HARVEST_MOON_RESOURCE_TYPE_CHANCES.tree).toBeCloseTo(1 / 7);
    expect(HARVEST_MOON_RESOURCE_TYPE_CHANCES['copper-ore']).toBeCloseTo(1 / 7);
    expect(HARVEST_MOON_RESOURCE_TYPE_CHANCES['iron-ore']).toBeCloseTo(1 / 7);
    expect(HARVEST_MOON_RESOURCE_TYPE_CHANCES['coal-ore']).toBeCloseTo(1 / 7);
  });

  it('can trigger an earthshake that opens a nearby dungeon on an empty hex', () => {
    let shaken: GameState | null = null;

    for (let day = 0; day < 400; day += 1) {
      const game = createGame(6, 'earthshake-seed');
      game.player.coord = { q: 1, r: -1 };
      game.worldTimeMs = day * GAME_DAY_DURATION_MS;
      game.dayPhase = 'night';

      const morning = syncBloodMoon(game, 7 * 60);
      if (morning.logs.some((entry) => /earthshake\./i.test(entry.text))) {
        shaken = morning;
        break;
      }
    }

    expect(shaken).not.toBeNull();
    expect(
      shaken?.logs.some(
        (entry) =>
          entry.kind === 'system' &&
          /earthshake\. a rift ruin opens nearby at/i.test(entry.text),
      ),
    ).toBe(true);
    expect(
      Object.values(shaken?.tiles ?? {}).some(
        (tile) => tile.structure === 'dungeon' && tile.enemyIds.length > 0,
      ),
    ).toBe(true);
  });

  it('can force an earthshake through the debugger action', () => {
    const game = createGame(6, 'forced-earthshake-seed');
    game.player.coord = { q: 0, r: 0 };

    const shaken = triggerEarthshake(game);

    expect(
      shaken.logs.some((entry) =>
        /earthshake\. a rift ruin opens nearby at/i.test(entry.text),
      ),
    ).toBe(true);
    expect(
      Object.values(shaken.tiles).some(
        (tile) => tile.structure === 'dungeon' && tile.enemyIds.length > 0,
      ),
    ).toBe(true);
    expect(getTileAt(shaken, shaken.homeHex).structure).toBeUndefined();
  });

  it('does not seed loose resource items onto freshly generated tiles', () => {
    const game = createGame(8, 'no-loose-resource-seed');

    for (let q = -8; q <= 8; q += 1) {
      for (let r = -8; r <= 8; r += 1) {
        if (Math.abs(q + r) > 8) continue;
        const tile = getTileAt(game, { q, r });
        expect(
          tile.items.some((item) => getItemCategory(item) === 'resource'),
        ).toBe(false);
      }
    }
  });

  it('drops extra higher-rarity loot during a blood moon', () => {
    const game = createGame(3, 'blood-moon-loot-seed');
    const target = { q: 2, r: 0 };
    game.bloodMoonActive = true;
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Raider',
      coord: target,
      rarity: 'epic',
      tier: 3,
      hp: 1,
      maxHp: 1,
      attack: 1,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);
    const tileItems = getTileAt(resolved, target).items;

    expect(tileItems.some((item) => item.name === 'Gold')).toBe(true);
    expect(
      tileItems.some(
        (item) =>
          ['weapon', 'armor', 'artifact'].includes(getItemCategory(item)) &&
          ['rare', 'epic', 'legendary'].includes(item.rarity),
      ),
    ).toBe(true);
  });

  it('grants rarer enemies stronger regular drop outcomes', () => {
    const game = createGame(3, 'rare-enemy-drop-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Raider',
      coord: target,
      rarity: 'legendary',
      tier: 4,
      hp: 1,
      maxHp: 1,
      attack: 1,
      defense: 0,
      xp: 5,
      elite: true,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);
    const tileItems = getTileAt(resolved, target).items;

    expect(tileItems.some((item) => item.name === 'Gold')).toBe(true);
    expect(
      tileItems.some((item) =>
        ['apple', 'water-flask', 'health-potion', 'mana-potion'].includes(
          item.itemKey ?? '',
        ),
      ),
    ).toBe(true);
  });

  it('spawns world bosses with boosted stats, a footprint, and guaranteed premium loot', () => {
    const { game, center } = createPlacedWorldBossEncounter();
    const centerTile = getTileAt(game, center);
    const worldBoss = getEnemyAt(game, center);
    const ordinaryEnemy = makeEnemy(
      game.seed,
      center,
      centerTile.terrain,
      0,
      undefined,
      false,
      { worldBoss: false },
    );

    expect(centerTile.enemyIds).toHaveLength(1);
    expect(worldBoss?.worldBoss).toBe(true);
    expect(worldBoss?.rarity).toBe('legendary');
    expect(worldBoss?.maxHp).toBeGreaterThan(ordinaryEnemy.maxHp * 50);
    expect(worldBoss?.attack).toBeGreaterThan(ordinaryEnemy.attack * 5);
    expect(worldBoss?.defense).toBeGreaterThan(ordinaryEnemy.defense);

    const footprintTiles = getVisibleTiles({
      ...game,
      player: { ...game.player, coord: center },
    }).filter((tile) => hexDistance(tile.coord, center) <= 1);
    expect(footprintTiles).toHaveLength(7);
    expect(
      footprintTiles.every((tile) =>
        tile.coord.q === center.q && tile.coord.r === center.r
          ? tile.enemyIds.length === 1
          : tile.enemyIds.length === 0 &&
            tile.items.length === 0 &&
            tile.structure === undefined,
      ),
    ).toBe(true);

    const approach = footprintTiles.find(
      (tile) =>
        hexDistance(tile.coord, center) === 1 &&
        tile.terrain !== 'rift' &&
        tile.terrain !== 'mountain',
    )?.coord;
    expect(approach).toBeDefined();

    game.player.coord = approach!;
    game.enemies[centerTile.enemyIds[0]] = {
      ...worldBoss!,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
    };

    let resolved = startCombat(moveToTile(game, center));
    for (let index = 0; index < 8 && resolved.combat != null; index += 1) {
      resolved = {
        ...resolved,
        worldTimeMs: resolved.worldTimeMs + 1_500,
        enemies: {
          ...resolved.enemies,
          [centerTile.enemyIds[0]]: {
            ...resolved.enemies[centerTile.enemyIds[0]]!,
            hp: 1,
            maxHp: 1,
            attack: 0,
            defense: 0,
          },
        },
      };
      resolved = progressCombat(resolved);
    }
    const loot = getTileAt(resolved, center).items;

    expect(resolved.combat).toBeNull();
    expect(loot.some((item) => item.name === 'Gold')).toBe(true);
    expect(
      loot.some(
        (item) =>
          ['weapon', 'armor', 'artifact'].includes(getItemCategory(item)) &&
          ['epic', 'legendary'].includes(item.rarity),
      ),
    ).toBe(true);
    expect(
      loot.some(
        (item) =>
          ['weapon', 'armor', 'artifact'].includes(getItemCategory(item)) &&
          item.rarity === 'legendary',
      ),
    ).toBe(true);
  });

  it('does not promote ordinary spawns on a boss-center hex into world bosses', () => {
    const { game, center } = createPlacedWorldBossEncounter();
    const centerTile = getTileAt(game, center);

    const ordinarySpawn = makeEnemy(
      game.seed,
      center,
      centerTile.terrain,
      1,
      undefined,
      false,
      { enemyId: 'enemy-boss-center-1' },
    );
    const explicitBoss = makeEnemy(
      game.seed,
      center,
      centerTile.terrain,
      0,
      undefined,
      false,
      { enemyId: centerTile.enemyIds[0], worldBoss: true },
    );

    expect(ordinarySpawn.worldBoss).toBe(false);
    expect(ordinarySpawn.maxHp).toBeLessThan(explicitBoss.maxHp);
    expect(ordinarySpawn.attack).toBeLessThan(explicitBoss.attack);
    expect(ordinarySpawn.defense).toBeLessThan(explicitBoss.defense);
  });

  it('turns an emptied dungeon back into a regular hex', () => {
    const game = createGame(3, 'dungeon-clear-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      structure: 'dungeon',
      items: [
        {
          id: 'resource-gold-1',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 3,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Raider',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: true,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const clearedCombat = startCombat(encountered);
    expect(getTileAt(clearedCombat, target).structure).toBe('dungeon');

    const looted = takeAllTileItems(clearedCombat);
    expect(getTileAt(looted, target).structure).toBeUndefined();
  });
});
