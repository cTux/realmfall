import { normalizeLoadedGame } from './normalize';
import { createGame, type GameState } from '../game/state';

describe('normalizeLoadedGame', () => {
  it('repairs legacy saves and consolidates stackable inventory', () => {
    const game = createGame(3, 'normalize-seed');
    const loaded = normalizeLoadedGame({
      ...game,
      logSequence: 0,
      logs: [
        { id: 'old-1', kind: 'system', turn: 1, text: 'first' },
        { id: 'old-2', kind: 'loot', turn: 2, text: 'second' },
      ],
      combat: { coord: { q: 0, r: 0 } } as GameState['combat'],
      tiles: {
        '0,0': {
          ...game.tiles['0,0'],
          structure: 'tree',
          structureHp: undefined,
          structureMaxHp: undefined,
          items: [
            {
              id: 'food-1',
              kind: 'consumable',
              name: 'Trail Ration',
              quantity: 1,
              tier: 1,
              rarity: 'common',
              power: 0,
              defense: 0,
              maxHp: 0,
              healing: 5,
              hunger: 10,
            },
          ],
          enemyIds: undefined,
          enemyId: 'legacy-enemy',
        } as unknown as (typeof game.tiles)['0,0'] & { enemyId: string },
      },
      player: {
        ...game.player,
        mana: undefined,
        baseMaxMana: undefined,
        skills: { logging: { level: 3, xp: 2 } },
        gold: 9,
        inventory: [
          {
            id: 'food-a',
            kind: 'consumable',
            name: 'Trail Ration',
            quantity: 2,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 5,
            hunger: 10,
          },
          {
            id: 'food-b',
            kind: 'consumable',
            name: 'Trail Ration',
            quantity: 1,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 5,
            hunger: 10,
          },
          {
            id: 'ore-a',
            kind: 'resource',
            name: 'Iron Ore',
            quantity: 2,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
          {
            id: 'ore-b',
            kind: 'resource',
            name: 'Iron Ore',
            quantity: 3,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
          {
            id: 'weapon-1',
            kind: 'weapon',
            slot: 'weapon',
            name: 'Rust Blade',
            quantity: 1,
            tier: 2,
            rarity: 'common',
            power: 4,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
        ],
        equipment: {
          weapon: {
            id: 'equip-1',
            kind: 'weapon',
            slot: 'weapon',
            name: 'Sword',
            quantity: 1,
            tier: 2,
            rarity: 'common',
            power: 3,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
        },
      } as unknown as typeof game.player & { gold: number },
    } as GameState);

    expect(loaded.player.mana).toBe(12);
    expect(loaded.player.baseMaxMana).toBe(12);
    expect(loaded.player.masteryLevel).toBe(0);
    expect(loaded.logSequence).toBe(2);
    expect(loaded.logs.map((entry) => entry.id)).toEqual(['l-1', 'l-2']);
    expect(loaded.combat?.enemyIds).toEqual([]);
    expect(loaded.tiles['0,0'].enemyIds).toEqual(['legacy-enemy']);
    expect(loaded.tiles['0,0'].structureHp).toBe(5);
    expect(loaded.player.skills.logging).toEqual({ level: 3, xp: 2 });
    expect(loaded.player.skills.mining).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.skills.cooking).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.skills.crafting).toEqual({ level: 1, xp: 0 });
    expect(
      loaded.player.inventory.find((item) => item.name === 'Trail Ration')
        ?.quantity,
    ).toBe(3);
    expect(
      loaded.player.inventory.find((item) => item.name === 'Iron Ore')
        ?.quantity,
    ).toBe(5);
    expect(
      loaded.player.inventory.find(
        (item) => item.kind === 'resource' && item.name === 'Gold',
      )?.quantity,
    ).toBe(9);
    expect(
      loaded.player.inventory.filter((item) => item.kind === 'weapon'),
    ).toHaveLength(1);
    expect(loaded.player.equipment.weapon?.rarity).toBe('common');
  });

  it('does not add legacy gold when inventory already contains gold and ignores invalid values', () => {
    const game = createGame(3, 'normalize-gold-seed');

    const loaded = normalizeLoadedGame({
      ...game,
      player: {
        ...game.player,
        gold: -10,
        inventory: [
          {
            id: 'resource-gold-1',
            kind: 'resource',
            name: 'Gold',
            quantity: 4,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
        ],
      } as typeof game.player & { gold: number },
    });

    expect(
      loaded.player.inventory.filter(
        (item) => item.kind === 'resource' && item.name === 'Gold',
      ),
    ).toHaveLength(1);
    expect(loaded.player.inventory[0]?.quantity).toBe(4);
  });
});
