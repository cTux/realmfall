import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResolveWorldTilesRequest } from '@realmfall/common';
import { resolveWorldTiles } from './worldTileResolutionPayloads';

describe('resolveWorldTiles', () => {
  it('builds deterministic payloads with enemy references resolved', () => {
    const request: ResolveWorldTilesRequest = {
      requestId: 'req-1',
      seed: 'worker-payload-seed',
      bloodMoonActive: false,
      coords: [
        { q: 2, r: 0 },
        { q: 2, r: -1 },
      ],
    };

    const first = resolveWorldTiles(request);
    const second = resolveWorldTiles(request);

    expect(second).toEqual(first);
    expect(first.requestId).toBe('req-1');
    expect(first.tiles.map((entry) => entry.coord)).toEqual(request.coords);

    first.tiles.forEach((entry) => {
      entry.tile.enemyIds.forEach((enemyId) => {
        expect(entry.enemies.some((enemy) => enemy.id === enemyId)).toBe(true);
      });
    });
  });
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.doUnmock('./world');
  vi.doUnmock('./combat');
  vi.doUnmock('./territories');
  vi.doUnmock('./worldBoss');
});

describe('resolveWorldTiles DTO mapping', () => {
  it('maps gameplay tile and enemy state into serializable DTO literals', async () => {
    vi.doMock('./world', () => ({
      buildTile: () => ({
        coord: { q: 4, r: -2 },
        terrain: 'forest',
        structure: 'town',
        structureHp: 12,
        structureMaxHp: 20,
        townStockDay: 7,
        townStockPurchasedItemIds: ['stock-1'],
        items: [
          {
            id: 'item-1',
            itemKey: 'wolf-pelt',
            tags: ['resource'],
            recipeId: 'recipe-1',
            locked: true,
            slot: 'weapon',
            icon: 'icon-1',
            name: 'Wolf Pelt',
            quantity: 3,
            tier: 2,
            rarity: 'rare',
            requiredLevel: 4,
            power: 5,
            defense: 1,
            maxHp: 0,
            healing: 0,
            hunger: 0,
            thirst: 0,
            secondaryStatCapacity: 1,
            secondaryStats: [{ key: 'attackSpeed', value: 2 }],
            reforgedSecondaryStatIndex: 0,
            enchantedSecondaryStatIndex: 0,
            corrupted: true,
            grantedAbilityId: 'skill-1',
            extraField: 'drop-me',
          },
        ],
        enemyIds: ['enemy-4,-2-0'],
        claim: {
          ownerId: 'faction-1',
          ownerType: 'faction',
          ownerName: 'Arkenreach',
          borderColor: '#ffffff',
          npc: {
            name: 'Sera',
            enemyId: 'enemy-4,-2-0',
          },
        },
        extraTileField: 'drop-me',
      }),
    }));
    vi.doMock('./combat', () => ({
      enemyIndexFromId: () => 0,
      makeEnemy: () => ({
        id: 'enemy-4,-2-0',
        enemyTypeId: 'wolf',
        tags: ['beast'],
        name: 'Sera',
        coord: { q: 4, r: -2 },
        rarity: 'epic',
        tier: 3,
        baseMaxHp: 14,
        hp: 14,
        maxHp: 14,
        mana: 8,
        maxMana: 8,
        baseAttack: 6,
        attack: 6,
        baseDefense: 4,
        defense: 4,
        xp: 10,
        elite: true,
        worldBoss: false,
        aggressive: false,
        statusEffects: [
          {
            id: 'bleeding',
            tags: ['debuff'],
            expiresAt: 5,
            tickIntervalMs: 2,
            lastProcessedAt: 1,
            stacks: 3,
            value: 7,
          },
        ],
        abilityIds: ['bite'],
        extraEnemyField: 'drop-me',
      }),
    }));
    vi.doMock('./territories', () => ({
      isFactionNpcEnemyId: () => false,
    }));
    vi.doMock('./worldBoss', () => ({
      isWorldBossEnemyId: () => false,
    }));

    const { resolveWorldTiles: resolveMockedWorldTiles } =
      await import('./worldTileResolutionPayloads');

    const result = resolveMockedWorldTiles({
      requestId: 'req-dto',
      seed: 'dto-seed',
      bloodMoonActive: false,
      coords: [{ q: 4, r: -2 }],
    });

    expect(result.tiles).toEqual([
      {
        coord: { q: 4, r: -2 },
        tile: {
          coord: { q: 4, r: -2 },
          terrain: 'forest',
          structure: 'town',
          structureHp: 12,
          structureMaxHp: 20,
          townStockDay: 7,
          townStockPurchasedItemIds: ['stock-1'],
          items: [
            {
              id: 'item-1',
              itemKey: 'wolf-pelt',
              tags: ['resource'],
              recipeId: 'recipe-1',
              locked: true,
              slot: 'weapon',
              icon: 'icon-1',
              name: 'Wolf Pelt',
              quantity: 3,
              tier: 2,
              rarity: 'rare',
              requiredLevel: 4,
              power: 5,
              defense: 1,
              maxHp: 0,
              healing: 0,
              hunger: 0,
              thirst: 0,
              secondaryStatCapacity: 1,
              secondaryStats: [{ key: 'attackSpeed', value: 2 }],
              reforgedSecondaryStatIndex: 0,
              enchantedSecondaryStatIndex: 0,
              corrupted: true,
              grantedAbilityId: 'skill-1',
            },
          ],
          enemyIds: ['enemy-4,-2-0'],
          claim: {
            ownerId: 'faction-1',
            ownerType: 'faction',
            ownerName: 'Arkenreach',
            borderColor: '#ffffff',
            npc: {
              name: 'Sera',
              enemyId: 'enemy-4,-2-0',
            },
          },
        },
        enemies: [
          {
            id: 'enemy-4,-2-0',
            enemyTypeId: 'wolf',
            tags: ['beast'],
            name: 'Sera',
            coord: { q: 4, r: -2 },
            rarity: 'epic',
            tier: 3,
            baseMaxHp: 14,
            hp: 14,
            maxHp: 14,
            mana: 8,
            maxMana: 8,
            baseAttack: 6,
            attack: 6,
            baseDefense: 4,
            defense: 4,
            xp: 10,
            elite: true,
            worldBoss: false,
            aggressive: false,
            statusEffects: [
              {
                id: 'bleeding',
                tags: ['debuff'],
                expiresAt: 5,
                tickIntervalMs: 2,
                lastProcessedAt: 1,
                stacks: 3,
                value: 7,
              },
            ],
            abilityIds: ['bite'],
          },
        ],
      },
    ]);
    expect(result.tiles[0]?.tile.items[0]).not.toHaveProperty('extraField');
    expect(result.tiles[0]?.tile).not.toHaveProperty('extraTileField');
    expect(result.tiles[0]?.enemies[0]).not.toHaveProperty('extraEnemyField');
  });

  it('passes faction npc and world boss branches into enemy creation options', async () => {
    const makeEnemy = vi.fn(() => ({
      id: 'world-boss-6,-2',
      name: 'Marshal Vey',
      coord: { q: 6, r: -2 },
      tier: 9,
      hp: 50,
      maxHp: 50,
      attack: 10,
      defense: 8,
      xp: 100,
      elite: true,
    }));

    vi.doMock('./world', () => ({
      buildTile: () => ({
        coord: { q: 6, r: -2 },
        terrain: 'forest',
        structure: undefined,
        items: [],
        enemyIds: ['world-boss-6,-2'],
        claim: {
          ownerId: 'faction-2',
          ownerType: 'faction',
          ownerName: 'Valewatch',
          borderColor: '#f59e0b',
          npc: {
            name: 'Marshal Vey',
            enemyId: 'world-boss-6,-2',
          },
        },
      }),
    }));
    vi.doMock('./combat', () => ({
      enemyIndexFromId: () => 9,
      makeEnemy,
    }));
    vi.doMock('./territories', () => ({
      isFactionNpcEnemyId: (enemyId: string) => enemyId === 'world-boss-6,-2',
    }));
    vi.doMock('./worldBoss', () => ({
      isWorldBossEnemyId: (enemyId: string) => enemyId === 'world-boss-6,-2',
    }));

    const { resolveWorldTiles: resolveMockedWorldTiles } =
      await import('./worldTileResolutionPayloads');

    resolveMockedWorldTiles({
      requestId: 'req-branches',
      seed: 'branch-seed',
      bloodMoonActive: true,
      coords: [{ q: 6, r: -2 }],
    });

    expect(makeEnemy).toHaveBeenCalledWith(
      'branch-seed',
      { q: 6, r: -2 },
      'forest',
      9,
      undefined,
      true,
      {
        enemyId: 'world-boss-6,-2',
        aggressive: false,
        allowTreasureGoblinOverride: false,
        name: 'Marshal Vey',
        worldBoss: true,
      },
    );
  });

  it('forwards treasure goblin override only for ordinary hostile overworld tiles', async () => {
    const makeEnemy = vi.fn(() => ({
      id: 'enemy-5,-1-0',
      name: 'Treasure Goblin',
      coord: { q: 5, r: -1 },
      tier: 4,
      hp: 50,
      maxHp: 50,
      attack: 10,
      defense: 8,
      xp: 100,
      elite: true,
    }));

    vi.doMock('./world', () => ({
      buildTile: () => ({
        coord: { q: 5, r: -1 },
        terrain: 'plains',
        structure: undefined,
        items: [],
        enemyIds: ['enemy-5,-1-0'],
      }),
    }));
    vi.doMock('./combat', () => ({
      enemyIndexFromId: () => 0,
      makeEnemy,
    }));
    vi.doMock('./territories', () => ({
      isFactionNpcEnemyId: () => false,
    }));
    vi.doMock('./worldBoss', () => ({
      isWorldBossEnemyId: () => false,
    }));

    const { resolveWorldTiles: resolveMockedWorldTiles } =
      await import('./worldTileResolutionPayloads');

    resolveMockedWorldTiles({
      requestId: 'req-hostile',
      seed: 'hostile-seed',
      bloodMoonActive: false,
      coords: [{ q: 5, r: -1 }],
    });

    expect(makeEnemy).toHaveBeenCalledWith(
      'hostile-seed',
      { q: 5, r: -1 },
      'plains',
      0,
      undefined,
      false,
      {
        enemyId: 'enemy-5,-1-0',
        aggressive: true,
        allowTreasureGoblinOverride: true,
        name: undefined,
        worldBoss: false,
      },
    );
  });

  it('keeps treasure goblin override disabled for claim NPC worker tiles without world boss flags', async () => {
    const makeEnemy = vi.fn(() => ({
      id: 'enemy-4,-1-0',
      name: 'Quartermaster Pell',
      coord: { q: 4, r: -1 },
      tier: 4,
      hp: 50,
      maxHp: 50,
      attack: 10,
      defense: 8,
      xp: 100,
      elite: false,
      worldBoss: false,
    }));

    vi.doMock('./world', () => ({
      buildTile: () => ({
        coord: { q: 4, r: -1 },
        terrain: 'plains',
        structure: undefined,
        items: [],
        enemyIds: ['enemy-4,-1-0'],
        claim: {
          ownerId: 'faction-1',
          ownerType: 'faction',
          ownerName: 'Valewatch',
          borderColor: '#ffffff',
          npc: {
            name: 'Quartermaster Pell',
            enemyId: 'enemy-4,-1-0',
          },
        },
      }),
    }));
    vi.doMock('./combat', () => ({
      enemyIndexFromId: () => 0,
      makeEnemy,
    }));
    vi.doMock('./territories', () => ({
      isFactionNpcEnemyId: (enemyId: string) => enemyId === 'enemy-4,-1-0',
    }));
    vi.doMock('./worldBoss', () => ({
      isWorldBossEnemyId: () => false,
    }));

    const { resolveWorldTiles: resolveMockedWorldTiles } =
      await import('./worldTileResolutionPayloads');

    resolveMockedWorldTiles({
      requestId: 'req-claim-npc',
      seed: 'claim-npc-seed',
      bloodMoonActive: false,
      coords: [{ q: 4, r: -1 }],
    });

    expect(makeEnemy).toHaveBeenCalledWith(
      'claim-npc-seed',
      { q: 4, r: -1 },
      'plains',
      0,
      undefined,
      false,
      {
        enemyId: 'enemy-4,-1-0',
        aggressive: false,
        allowTreasureGoblinOverride: false,
        name: 'Quartermaster Pell',
        worldBoss: false,
      },
    );
  });
});
