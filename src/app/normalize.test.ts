import { normalizeLoadedGame } from './normalize';
import { EquipmentSlotId } from '../game/content/ids';
import { createGame, Skill, type GameState } from '../game/state';

describe('normalizeLoadedGame', () => {
  it('repairs legacy saves and consolidates stackable inventory', () => {
    const game = createGame(3, 'normalize-seed');
    const loaded = normalizeLoadedGame({
      ...game,
      homeHex: { q: 2, r: -1 },
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
        skills: { [Skill.Logging]: { level: 3, xp: 2 } },
        statusEffects: [
          {
            id: 'restoration',
            expiresAt: '12000',
            tickIntervalMs: '1000',
            lastProcessedAt: '5000',
          },
        ],
        gold: 9,
        inventory: [
          {
            id: 'food-a',
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
            slot: EquipmentSlotId.Weapon,
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
            slot: EquipmentSlotId.Weapon,
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
    expect(loaded.player.skills[Skill.Logging]).toEqual({ level: 3, xp: 2 });
    expect(loaded.player.skills[Skill.Gathering]).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.skills[Skill.Mining]).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.skills[Skill.Cooking]).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.skills[Skill.Smelting]).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.skills[Skill.Crafting]).toEqual({ level: 1, xp: 0 });
    expect(loaded.player.statusEffects).toEqual([
      expect.objectContaining({
        id: 'restoration',
        expiresAt: 12000,
        tickIntervalMs: 1000,
        lastProcessedAt: 5000,
        tags: ['status.buff', 'status.restoration'],
      }),
    ]);
    expect(loaded.homeHex).toEqual({ q: 2, r: -1 });
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
        (item) => item.itemKey === 'gold' && item.name === 'Gold',
      )?.quantity,
    ).toBe(9);
    expect(
      loaded.player.inventory.filter(
        (item) => item.slot === EquipmentSlotId.Weapon,
      ),
    ).toHaveLength(1);
    expect(loaded.player.equipment.weapon?.rarity).toBe('common');
  });

  it('does not add legacy gold when inventory already contains canonical gold and ignores invalid values', () => {
    const game = createGame(3, 'normalize-gold-seed');

    const loaded = normalizeLoadedGame({
      ...game,
      player: {
        ...game.player,
        gold: -10,
        inventory: [
          {
            id: 'resource-gold-1',
            itemKey: 'gold',
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
        (item) => item.itemKey === 'gold' && item.name === 'Gold',
      ),
    ).toHaveLength(1);
    expect(loaded.player.inventory[0]?.quantity).toBe(4);
  });

  it('preserves saved home hex coordinates', () => {
    const game = createGame(3, 'normalize-home-hex');

    const loaded = normalizeLoadedGame({
      ...game,
      homeHex: { q: 2, r: -1 },
      tiles: {
        '2,-1': {
          coord: { q: 2, r: -1 },
          terrain: 'plains',
          structure: 'camp',
          items: [
            {
              id: 'resource-gold-home',
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
          enemyIds: ['enemy-2,-1-0'],
        },
      },
    });

    expect(loaded.homeHex).toEqual({ q: 2, r: -1 });
    expect(loaded.tiles['2,-1']).toMatchObject({
      structure: undefined,
      items: [],
      enemyIds: [],
    });
  });

  it('uniquifies duplicate non-stackable item ids in saves', () => {
    const game = createGame(3, 'normalize-duplicate-ids');

    const loaded = normalizeLoadedGame({
      ...game,
      homeHex: { q: 2, r: -1 },
      tiles: {
        '0,0': {
          ...game.tiles['0,0'],
          items: [
            {
              id: 'feet-wolf-treads--18,143',
              slot: EquipmentSlotId.Feet,
              name: 'Wolf Treads',
              quantity: 1,
              tier: 3,
              rarity: 'common',
              power: 0,
              defense: 4,
              maxHp: 3,
              healing: 0,
              hunger: 0,
            },
            {
              id: 'feet-wolf-treads--18,143',
              slot: EquipmentSlotId.Feet,
              name: 'Wolf Treads',
              quantity: 1,
              tier: 3,
              rarity: 'common',
              power: 0,
              defense: 4,
              maxHp: 3,
              healing: 0,
              hunger: 0,
            },
          ],
        },
      },
      player: {
        ...game.player,
        inventory: [
          {
            id: 'feet-wolf-treads--18,143',
            slot: EquipmentSlotId.Feet,
            name: 'Wolf Treads',
            quantity: 1,
            tier: 3,
            rarity: 'common',
            power: 0,
            defense: 4,
            maxHp: 3,
            healing: 0,
            hunger: 0,
          },
          {
            id: 'feet-wolf-treads--18,143',
            slot: EquipmentSlotId.Feet,
            name: 'Wolf Treads',
            quantity: 1,
            tier: 3,
            rarity: 'common',
            power: 0,
            defense: 4,
            maxHp: 3,
            healing: 0,
            hunger: 0,
          },
        ],
      },
    });

    expect(new Set(loaded.player.inventory.map((item) => item.id)).size).toBe(
      2,
    );
    expect(new Set(loaded.tiles['0,0'].items.map((item) => item.id)).size).toBe(
      2,
    );
  });

  it('hydrates configured item keys into locale-safe items', () => {
    const game = createGame(3, 'normalize-item-key');

    const loaded = normalizeLoadedGame({
      ...game,
      player: {
        ...game.player,
        inventory: [
          {
            id: 'home-scroll-1',
            itemKey: 'home-scroll',
            name: 'Pergamino del hogar',
            quantity: 1,
            tier: 1,
            rarity: 'common',
            power: 0,
            defense: 0,
            maxHp: 0,
            healing: 0,
            hunger: 0,
          },
        ],
      },
    });

    expect(loaded.player.inventory[0]).toMatchObject({
      itemKey: 'home-scroll',
      name: 'Hearthshard Wayscroll',
    });
  });

  it('backfills inferred tags for equippable items without hydrated tags', () => {
    const game = createGame(3, 'normalize-equipment-tags');
    const loaded = normalizeLoadedGame({
      ...game,
      player: {
        ...game.player,
        equipment: {
          weapon: {
            id: 'legacy-weapon',
            slot: EquipmentSlotId.Weapon,
            name: 'Legacy Blade',
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
      },
    });

    expect(loaded.player.equipment.weapon?.tags).toEqual([
      'item.equipment',
      'item.weapon',
      'item.slot.weapon',
    ]);
  });

  it('preserves claim metadata and neutral residents on tiles', () => {
    const game = createGame(3, 'normalize-claims');

    const loaded = normalizeLoadedGame({
      ...game,
      tiles: {
        '1,0': {
          coord: { q: 1, r: 0 },
          terrain: 'plains',
          items: [],
          enemyIds: [],
          claim: {
            ownerId: 'faction-1',
            ownerType: 'faction',
            ownerName: 'Arkenreach',
            borderColor: '#f59e0b',
            npc: { name: 'Araken' },
          },
        },
      },
    });

    expect(loaded.tiles['1,0'].claim).toEqual({
      ownerId: 'faction-1',
      ownerType: 'faction',
      ownerName: 'Arkenreach',
      borderColor: '#f59e0b',
      npc: { name: 'Araken' },
    });
  });

  it('preserves persisted custom enemy names when config ids are present', () => {
    const game = createGame(3, 'normalize-enemy-name');

    const loaded = normalizeLoadedGame({
      ...game,
      enemies: {
        'npc-1': {
          id: 'npc-1',
          enemyTypeId: 'raider',
          name: 'Araken',
          coord: { q: 1, r: 0 },
          tier: 2,
          hp: 12,
          maxHp: 12,
          attack: 4,
          defense: 2,
          xp: 10,
          elite: false,
        },
      },
      tiles: {
        ...game.tiles,
        '1,0': {
          coord: { q: 1, r: 0 },
          terrain: 'plains',
          items: [],
          enemyIds: ['npc-1'],
          claim: {
            ownerId: 'faction-1',
            ownerType: 'faction',
            ownerName: 'Arkenreach',
            borderColor: '#f59e0b',
            npc: { name: 'Araken', enemyId: 'npc-1' },
          },
        },
      },
    });

    expect(loaded.enemies['npc-1']).toMatchObject({
      enemyTypeId: 'raider',
      name: 'Araken',
      tags: ['enemy.hostile', 'enemy.humanoid'],
    });
  });
});
