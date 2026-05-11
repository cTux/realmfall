import {
  normalizeLoadedGame,
  normalizePersistedUiState,
  normalizeSavedUiItem,
} from './normalizeTestkit';
import { ENEMY_TYPE_IDS } from '@realmfall/core/game/content/ids';
import { createCombatActorState } from '@realmfall/core/game/combat';
import {
  RARITY_ORDER,
  STRUCTURE_TYPES,
  TERRAINS,
} from '@realmfall/core/game/stateTypes';
import { createGame } from '@realmfall/core/game/stateFactory';
import { createDefaultActionBarSlots } from './App/actionBar';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
} from './constants';

describe('normalizeLoadedGame', () => {
  it('clones valid saved game state', () => {
    const game = createGame(3, 'normalize-seed');

    expect(normalizeLoadedGame(game)).toEqual({
      ...game,
      logs: [],
    });
  });

  it('falls back invalid inventory entries to defaults instead of rejecting the save', () => {
    const game = createGame(3, 'normalize-seed');
    game.player.inventory[0]!.quantity = Number.NaN;

    expect(normalizeLoadedGame(game)?.player.inventory).toEqual(
      game.player.inventory.slice(1),
    );
  });

  it('fills missing skills from current runtime defaults while preserving saved progress', () => {
    const game = createGame(3, 'normalize-missing-skill-seed');
    const saved = structuredClone(game);

    delete (saved.player.skills as Partial<typeof saved.player.skills>)
      .crafting;
    saved.player.skills.gathering = { level: 7, xp: 123 };

    const normalized = normalizeLoadedGame(saved);

    expect(normalized?.player.skills.gathering).toEqual({ level: 7, xp: 123 });
    expect(normalized?.player.skills.crafting).toEqual(
      game.player.skills.crafting,
    );
  });

  it('fills missing lockpicking progress from current runtime defaults while preserving saved skills', () => {
    const game = createGame(3, 'normalize-lockpicking-seed');
    const saved = structuredClone(game);

    delete (saved.player.skills as Partial<typeof saved.player.skills>)
      .lockpicking;
    saved.player.skills.gathering = { level: 7, xp: 123 };

    const normalized = normalizeLoadedGame(saved);

    expect(normalized?.player.skills.gathering).toEqual({
      level: 7,
      xp: 123,
    });
    expect(normalized?.player.skills.lockpicking).toEqual(
      game.player.skills.lockpicking,
    );
  });

  it('preserves a valid saved mana anchor binding', () => {
    const game = createGame(3, 'normalize-mana-anchor-seed');
    const saved = {
      ...structuredClone(game),
      manaAnchorHex: { q: 2, r: -1 },
    };

    expect(normalizeLoadedGame(saved)).toMatchObject({
      manaAnchorHex: { q: 2, r: -1 },
    });
  });

  it('deep-clones nested tile and item fields during hydration and world fallback reuse', () => {
    const game = createGame(3, 'normalize-deep-clone-seed');
    const homeKey = `${game.homeHex.q},${game.homeHex.r}`;

    game.player.inventory[0] = {
      ...game.player.inventory[0]!,
      secondaryStats: [{ key: 'attackSpeed', value: 3 }],
    };
    game.player.equipment.weapon = {
      ...game.player.inventory[0]!,
      id: 'equipped-weapon',
      slot: 'weapon',
      secondaryStats: [{ key: 'criticalStrikeChance', value: 4 }],
    };
    game.tiles[homeKey] = {
      coord: { ...game.homeHex },
      terrain: 'plains',
      enemyIds: [],
      structure: undefined,
      townStockDay: 12,
      townStockPurchasedItemIds: ['stock-1'],
      items: [
        {
          ...game.player.inventory[0]!,
          id: 'tile-item-1',
          secondaryStats: [{ key: 'blockChance', value: 2 }],
        },
      ],
    };

    const saved = structuredClone(game);
    (saved as unknown as { worlds: unknown }).worlds = null;

    const normalized = normalizeLoadedGame(saved);
    expect(normalized).not.toBeNull();
    const normalizedTile = normalized?.tiles[homeKey];
    const normalizedWorldTile =
      normalized?.worlds[normalized.surfaceWorldId]?.tiles[homeKey];

    expect(normalizedTile?.townStockDay).toBe(12);
    expect(normalizedTile?.townStockPurchasedItemIds).toEqual(['stock-1']);
    expect(normalizedTile?.townStockPurchasedItemIds).not.toBe(
      saved.tiles[homeKey]?.townStockPurchasedItemIds,
    );
    expect(normalizedTile?.items[0]?.secondaryStats).toEqual([
      { key: 'blockChance', value: 2 },
    ]);
    expect(normalizedTile?.items[0]?.secondaryStats).not.toBe(
      saved.tiles[homeKey]?.items[0]?.secondaryStats,
    );
    expect(normalized?.player.inventory[0]?.secondaryStats).toEqual([
      { key: 'attackSpeed', value: 3 },
    ]);
    expect(normalized?.player.inventory[0]?.secondaryStats).not.toBe(
      saved.player.inventory[0]?.secondaryStats,
    );
    expect(normalized?.player.equipment.weapon?.secondaryStats).toEqual([
      { key: 'criticalStrikeChance', value: 4 },
    ]);
    expect(normalized?.player.equipment.weapon?.secondaryStats).not.toBe(
      saved.player.equipment.weapon?.secondaryStats,
    );
    expect(normalizedWorldTile?.townStockPurchasedItemIds).toEqual(['stock-1']);
    expect(normalizedWorldTile?.items[0]?.secondaryStats).toEqual([
      { key: 'blockChance', value: 2 },
    ]);
  });

  it('falls back invalid nested player fields to defaults instead of rejecting the save', () => {
    const game = createGame(3, 'normalize-invalid-player-field-seed');
    const saved = structuredClone(game);

    (saved.player as unknown as Record<string, unknown>).hunger = 'bad-value';
    saved.player.level = 9;

    const normalized = normalizeLoadedGame(saved);

    expect(normalized?.player.level).toBe(9);
    expect(normalized?.player.hunger).toBe(game.player.hunger);
  });

  it('rejects malformed saved ui items', () => {
    expect(normalizeSavedUiItem({ id: 'broken' })).toBeNull();
  });

  it('clones valid saved ui items', () => {
    const game = createGame(3, 'normalize-ui-item-seed');
    const item = game.player.inventory[0]!;

    expect(normalizeSavedUiItem(item)).toEqual(item);
  });

  it('refreshes configured item names from canonical item configs', () => {
    const normalized = normalizeSavedUiItem({
      id: 'ration-1',
      itemKey: 'trail-ration',
      name: 'game.item.trail-ration.name',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 10,
      hunger: 15,
      thirst: 0,
    });

    expect(normalized?.name).toBe('Trail Ration');
  });

  it('accepts canonical runtime save values from shared game constants', () => {
    const game = createGame(3, 'normalize-runtime-values-seed');
    const homeKey = `${game.homeHex.q},${game.homeHex.r}`;
    const lastTerrain = TERRAINS[TERRAINS.length - 1]!;
    const lastStructure = STRUCTURE_TYPES[STRUCTURE_TYPES.length - 1]!;
    const lastRarity = RARITY_ORDER[RARITY_ORDER.length - 1]!;
    const lastEnemyTypeId = ENEMY_TYPE_IDS[ENEMY_TYPE_IDS.length - 1]!;
    const enemyId = 'normalize-enemy';

    game.tiles[homeKey] = {
      ...game.tiles[homeKey]!,
      terrain: lastTerrain,
      structure: lastStructure,
    };
    game.player.inventory[0] = {
      ...game.player.inventory[0]!,
      rarity: lastRarity,
    };
    game.tiles[homeKey]!.enemyIds = [enemyId];
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: lastEnemyTypeId,
      name: 'Normalize Enemy',
      coord: { ...game.homeHex },
      rarity: lastRarity,
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };

    expect(normalizeLoadedGame(game)).toEqual({
      ...game,
      logs: [],
    });
  });

  it('backfills missing enemy type ids from legacy enemy names', () => {
    const game = createGame(3, 'normalize-enemy-type-seed');
    const enemyId = 'normalize-wolf';

    game.tiles['0,0']!.enemyIds = [enemyId];
    game.enemies[enemyId] = {
      id: enemyId,
      name: 'Wolf',
      coord: { ...game.homeHex },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };

    expect(normalizeLoadedGame(game)?.enemies[enemyId]?.enemyTypeId).toBe(
      'wolf',
    );
  });

  it('refreshes configured enemy names from canonical enemy configs when saves contain i18n keys', () => {
    const game = createGame(3, 'normalize-world-boss-name-seed');
    const enemyId = 'world-boss-8,-4';

    game.tiles['0,0']!.enemyIds = [enemyId];
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'gluttony',
      name: 'game.enemy.gluttony.name',
      coord: { ...game.homeHex },
      rarity: 'legendary',
      tier: 12,
      hp: 500,
      maxHp: 500,
      attack: 40,
      defense: 20,
      xp: 5,
      elite: true,
      worldBoss: true,
    };

    expect(normalizeLoadedGame(game)?.enemies[enemyId]?.name).toBe('Gluttony');
  });

  it('preserves treasure goblin combat metadata during hydration', () => {
    const game = createGame(3, 'normalize-treasure-goblin-combat-seed');
    const enemyId = 'enemy-2,0-0';
    const coord = { q: 2, r: 0 };

    game.tiles['2,0'] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'treasure-goblin',
      name: 'Treasure Goblin',
      coord,
      rarity: 'legendary',
      tier: 3,
      hp: 50,
      maxHp: 50,
      attack: 5,
      defense: 2,
      xp: 10,
      elite: true,
    };
    game.combat = {
      coord,
      enemyIds: [enemyId],
      started: true,
      startedAtMs: 1234,
      player: createCombatActorState(0, ['kick']),
      enemies: {
        [enemyId]: createCombatActorState(0, ['kick']),
      },
      enemyStateById: {
        [enemyId]: {
          treasureGoblin: {
            damageHitsTaken: 2,
            fleeHitsRequired: 4,
          },
        },
      },
    };

    expect(normalizeLoadedGame(game)?.combat).toEqual({
      ...game.combat,
      engagement: {
        autoStepOnVictory: false,
        engageMode: 'tile-step',
        originCoord: coord,
        stagingCoord: coord,
        targetCoord: coord,
      },
    });
  });

  it('defaults invalid combat encounter metadata safely during hydration', () => {
    const game = createGame(3, 'normalize-invalid-combat-metadata-seed');
    const enemyId = 'enemy-2,0-0';
    const coord = { q: 2, r: 0 };

    game.tiles['2,0'] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'treasure-goblin',
      name: 'Treasure Goblin',
      coord,
      rarity: 'legendary',
      tier: 3,
      hp: 50,
      maxHp: 50,
      attack: 5,
      defense: 2,
      xp: 10,
      elite: true,
    };

    const saved = structuredClone(game);
    const invalidEnemyStateById: Record<string, unknown> = {
      [enemyId]: {
        treasureGoblin: {
          damageHitsTaken: 'bad',
          fleeHitsRequired: Number.NaN,
        },
      },
    };

    const invalidCombat: Record<string, unknown> = {
      coord,
      enemyIds: [enemyId],
      started: true,
      startedAtMs: 1234,
      player: createCombatActorState(0, ['kick']),
      enemies: {
        [enemyId]: createCombatActorState(0, ['kick']),
      },
      enemyStateById: invalidEnemyStateById,
    };
    (saved as unknown as { combat: Record<string, unknown> }).combat =
      invalidCombat;

    expect(normalizeLoadedGame(saved)?.combat?.enemyStateById).toEqual({
      [enemyId]: {},
    });
  });

  it('drops negative, fractional, and out-of-range treasure goblin metadata during hydration', () => {
    const game = createGame(3, 'normalize-invalid-treasure-goblin-range-seed');
    const enemyId = 'enemy-2,0-0';
    const coord = { q: 2, r: 0 };

    game.tiles['2,0'] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'treasure-goblin',
      name: 'Treasure Goblin',
      coord,
      rarity: 'legendary',
      tier: 3,
      hp: 50,
      maxHp: 50,
      attack: 5,
      defense: 2,
      xp: 10,
      elite: true,
    };

    const buildSavedCombat = (treasureGoblin: Record<string, unknown>) => ({
      coord,
      enemyIds: [enemyId],
      started: true,
      startedAtMs: 1234,
      player: createCombatActorState(0, ['kick']),
      enemies: {
        [enemyId]: createCombatActorState(0, ['kick']),
      },
      enemyStateById: {
        [enemyId]: { treasureGoblin },
      },
    });

    const negativeSaved = structuredClone(game);
    (negativeSaved as unknown as { combat: Record<string, unknown> }).combat =
      buildSavedCombat({
        damageHitsTaken: -1,
        fleeHitsRequired: 4,
      });

    const fractionalSaved = structuredClone(game);
    (fractionalSaved as unknown as { combat: Record<string, unknown> }).combat =
      buildSavedCombat({
        damageHitsTaken: 1.5,
        fleeHitsRequired: 4.25,
      });

    const outOfRangeSaved = structuredClone(game);
    (outOfRangeSaved as unknown as { combat: Record<string, unknown> }).combat =
      buildSavedCombat({
        damageHitsTaken: 1,
        fleeHitsRequired: 99,
      });

    expect(normalizeLoadedGame(negativeSaved)?.combat?.enemyStateById).toEqual({
      [enemyId]: {},
    });
    expect(
      normalizeLoadedGame(fractionalSaved)?.combat?.enemyStateById,
    ).toEqual({
      [enemyId]: {},
    });
    expect(
      normalizeLoadedGame(outOfRangeSaved)?.combat?.enemyStateById,
    ).toEqual({
      [enemyId]: {},
    });
  });

  it('normalizes combat engagement metadata and drops persisted floating-text leftovers', () => {
    const baseline = createGame(3, 'normalize-combat-engagement');
    const normalized = normalizeLoadedGame({
      seed: 'normalize-combat-engagement',
      radius: 3,
      player: baseline.player,
      tiles: {},
      enemies: {},
      logs: [],
      worlds: baseline.worlds,
      surfaceWorldId: 'surface',
      activeWorldId: 'surface',
      dungeonEntrances: {},
      activeDungeon: null,
      homeHex: { q: 0, r: 0 },
      turn: 0,
      worldTimeMs: 1234,
      dayPhase: 'day',
      bloodMoonActive: false,
      bloodMoonCheckedTonight: false,
      bloodMoonCycle: 0,
      harvestMoonActive: false,
      harvestMoonCheckedTonight: false,
      harvestMoonCycle: 0,
      lastEarthshakeDay: 0,
      gameOver: false,
      logSequence: 0,
      worldFloatingTextEvents: [
        {
          id: 'stale-event',
          anchor: { kind: 'player', coord: { q: 0, r: 0 } },
          amount: 7,
          createdAtMs: 1200,
          kind: 'damage',
        },
      ],
      combat: {
        coord: { q: 0, r: 0 },
        enemyIds: ['enemy-0,0-0'],
        started: true,
        startedAtMs: 1234,
        engagement: {
          engageMode: 'adjacent-click',
          originCoord: { q: 0, r: 0 },
          stagingCoord: { q: 0, r: 0 },
          targetCoord: { q: 1, r: 0 },
          autoStepOnVictory: true,
        },
        player: {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 1234,
          cooldownEndsAt: {},
          casting: null,
        },
        enemies: {
          'enemy-0,0-0': {
            abilityIds: ['kick'],
            globalCooldownMs: 1500,
            globalCooldownEndsAt: 1234,
            cooldownEndsAt: {},
            casting: null,
          },
        },
        enemyStateById: { 'enemy-0,0-0': {} },
      },
    });

    expect(normalized?.combat?.engagement?.targetCoord).toEqual({ q: 1, r: 0 });
    expect(normalized?.worldFloatingTextEvents ?? []).toEqual([]);
  });

  it('normalizes dungeon world registries and the dungeon chest structure', () => {
    const normalized = normalizeLoadedGame({
      seed: 'normalize-dungeon-world',
      radius: 3,
      surfaceWorldId: 'surface',
      activeWorldId: 'dungeon:normalize-dungeon-world:1,0',
      worlds: {
        surface: {
          id: 'surface',
          kind: 'surface',
          tiles: {},
          enemies: {},
        },
        'dungeon:normalize-dungeon-world:1,0': {
          id: 'dungeon:normalize-dungeon-world:1,0',
          kind: 'dungeon',
          tiles: {
            '0,0': {
              coord: { q: 0, r: 0 },
              terrain: 'dungeon-obsidian-floor',
              structure: 'dungeon-chest',
              items: [],
              enemyIds: [],
            },
          },
          enemies: {},
          dungeon: {
            cleared: false,
            entranceCoord: { q: 0, r: 0 },
            finalChestCoord: { q: 0, r: 0 },
            finalEliteEnemyId: 'enemy-0,1-0',
            paddingRadius: 6,
            surfaceEntranceCoord: { q: 1, r: 0 },
            templateId: 'dense-maze',
            themeId: 'obsidian-vault',
          },
        },
      },
      dungeonEntrances: {
        '1,0': {
          dungeonId: 'dungeon:normalize-dungeon-world:1,0',
          surfaceCoord: { q: 1, r: 0 },
        },
      },
      activeDungeon: {
        dungeonId: 'dungeon:normalize-dungeon-world:1,0',
        returnCoord: { q: 1, r: 0 },
        surfaceCoord: { q: 1, r: 0 },
      },
    });

    expect(normalized?.activeWorldId).toBe(
      'dungeon:normalize-dungeon-world:1,0',
    );
    expect(normalized?.tiles['0,0']?.structure).toBe('dungeon-chest');
  });
});

describe('normalizePersistedUiState', () => {
  it('falls back to defaults when persisted ui is malformed', () => {
    expect(normalizePersistedUiState('{not-an-object')).toEqual({
      actionBarSlots: createDefaultActionBarSlots(),
      logFilters: DEFAULT_LOG_FILTERS,
      windowShown: DEFAULT_WINDOW_VISIBILITY,
      windows: DEFAULT_WINDOWS,
    });
  });

  it('drops malformed action bar items and window values', () => {
    const game = createGame(3, 'normalize-ui-state-seed');

    expect(
      normalizePersistedUiState({
        actionBarSlots: [
          { item: game.player.inventory[0] },
          { item: { id: 1 } },
        ],
        logFilters: {
          movement: false,
          combat: 'yes',
        },
        windowShown: {
          hero: true,
          inventory: 'open',
        },
        windows: {
          hero: { x: 10, y: 12, width: -4 },
          inventory: { x: 'bad', y: 20 },
        },
      }),
    ).toEqual({
      actionBarSlots: [
        { item: game.player.inventory[0] },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      logFilters: {
        ...DEFAULT_LOG_FILTERS,
        movement: false,
      },
      windowShown: {
        ...DEFAULT_WINDOW_VISIBILITY,
        hero: true,
      },
      windows: {
        ...DEFAULT_WINDOWS,
        hero: {
          ...DEFAULT_WINDOWS.hero,
          x: 10,
          y: 12,
        },
        inventory: {
          ...DEFAULT_WINDOWS.inventory,
          y: 20,
        },
      },
    });
  });

  it('restores a missing command log filter entry during UI normalization', () => {
    expect(
      normalizePersistedUiState({
        actionBarSlots: createDefaultActionBarSlots(),
        logFilters: {
          movement: true,
          combat: true,
          loot: true,
          survival: true,
          rumor: true,
          motd: true,
          system: true,
        },
        windowShown: DEFAULT_WINDOW_VISIBILITY,
        windows: DEFAULT_WINDOWS,
      }).logFilters.command,
    ).toBe(true);
  });
});
