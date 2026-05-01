import { getWorldDayIndex } from './logs';
import { createGame, getTileAt } from './state';
import {
  addDebugDropItemToInventory,
  addDebugEquipmentItemToInventory,
  forceDebugBloodMoon,
  forceDebugHarvestMoon,
  setDebugMorning,
  spawnDebugEnemyNearby,
} from './stateDebug';

describe('game state debug helpers', () => {
  it('adds a requested-rarity equipment item to the inventory', () => {
    const game = createGame(3, 'debug-equipment-seed');

    const next = addDebugEquipmentItemToInventory(game, {
      rarity: 'epic',
      type: 'weapon',
    });

    expect(
      next.player.inventory.some(
        (item) =>
          item.rarity === 'epic' &&
          item.slot === 'weapon' &&
          item.power > 0 &&
          item.id !== 'starter-knife',
      ),
    ).toBe(true);
  });

  it('adds a selected droppable item config to the inventory', () => {
    const game = createGame(3, 'debug-drop-seed');

    const next = addDebugDropItemToInventory(game, 'platinum-ore');

    expect(
      next.player.inventory.some(
        (item) => item.itemKey === 'platinum-ore' && item.quantity === 1,
      ),
    ).toBe(true);
  });

  it('spawns a selected enemy type and rarity on a nearby tile', () => {
    const game = createGame(3, 'debug-enemy-seed');
    game.player.coord = { q: 0, r: 0 };

    const next = spawnDebugEnemyNearby(game, {
      enemyTypeId: 'raider',
      rarity: 'legendary',
    });

    const spawnedEnemy = Object.values(next.enemies).find(
      (enemy) =>
        enemy.enemyTypeId === 'raider' &&
        enemy.rarity === 'legendary' &&
        (enemy.coord.q !== 0 || enemy.coord.r !== 0),
    );

    expect(spawnedEnemy).toBeDefined();
    expect(getTileAt(next, spawnedEnemy!.coord).enemyIds).toContain(
      spawnedEnemy!.id,
    );
  });

  it('forces blood and harvest moon events on demand', () => {
    const game = createGame(4, 'debug-world-events-seed');
    game.player.coord = { q: 1, r: -1 };

    const bloodMoon = forceDebugBloodMoon(game);
    expect(bloodMoon.bloodMoonActive).toBe(true);
    expect(
      bloodMoon.logs.some((entry) => /blood moon begins/i.test(entry.text)),
    ).toBe(true);

    const harvestMoon = forceDebugHarvestMoon(game);
    expect(harvestMoon.harvestMoonActive).toBe(true);
    expect(
      harvestMoon.logs.some((entry) => /harvest moon rises/i.test(entry.text)),
    ).toBe(true);
  });

  it('advances morning to the next world day', () => {
    const game = createGame(3, 'debug-morning-seed');
    game.worldTimeMs = 0;
    game.dayPhase = 'night';

    const next = setDebugMorning(game);

    expect(next.dayPhase).toBe('day');
    expect(getWorldDayIndex(next.worldTimeMs)).toBe(
      getWorldDayIndex(game.worldTimeMs) + 1,
    );
  });
});
