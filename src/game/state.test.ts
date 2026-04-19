import {
  buyTownItem,
  claimCurrentHex,
  craftRecipe,
  createGame,
  dropInventoryItem,
  EQUIPMENT_SLOTS,
  equipItem,
  HARVEST_MOON_RESOURCE_TYPE_CHANCES,
  getEnemyAt,
  getEnemiesAt,
  getGoldAmount,
  getPlayerStats,
  getRecipeBookEntries,
  getRecipeBookRecipes,
  getSafePathToTile,
  getTileAt,
  getTownStock,
  getVisibleTiles,
  interactWithStructure,
  moveToTile,
  moveAlongSafePath,
  progressCombat,
  prospectInventoryItem,
  prospectInventory,
  sellInventoryItem,
  sellAllItems,
  setInventoryItemLocked,
  setHomeHex,
  sortInventory,
  startCombat,
  syncBloodMoon,
  syncPlayerStatusEffects,
  takeAllTileItems,
  takeTileItem,
  triggerEarthshake,
  useItem,
  type GameState,
  type Item,
} from './state';
import { GameTag } from './content/tags';
import { hexDistance, hexKey, hexNeighbors } from './hex';
import { makeEnemy } from './combat';
import {
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
  HOME_SCROLL_ITEM_NAME_KEY,
  WORLD_REVEAL_RADIUS,
} from './config';
import { t } from '../i18n';
import { buildTile } from './world';
import { buildItemFromConfig, getItemCategory } from './content/items';
import { getStructureConfig } from './content/structures';
import { Skill } from './types';

describe('game state', () => {
  function createPlacedWorldBossEncounter() {
    const game = createGame(8, 'placed-world-boss-seed');
    const center = { q: 4, r: 0 };
    const bossId = `world-boss-${hexKey(center)}`;

    game.tiles[hexKey(center)] = {
      coord: center,
      terrain: 'forest',
      items: [],
      structure: undefined,
      enemyIds: [bossId],
    };
    hexNeighbors(center).forEach((coord) => {
      game.tiles[hexKey(coord)] = {
        coord,
        terrain: 'forest',
        items: [],
        structure: undefined,
        enemyIds: [],
      };
    });
    game.enemies[bossId] = makeEnemy(
      game.seed,
      center,
      'forest',
      0,
      undefined,
      false,
      { enemyId: bossId, worldBoss: true },
    );

    return { game, center, bossId };
  }

  it('creates a centered start in a visible hex viewport', () => {
    const game = createGame(3, 'test-seed');
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
    expect(getTileAt(game, { q: 0, r: 0 }).terrain).toBe('plains');
    expect(getTileAt(game, { q: 0, r: 0 }).structure).toBeUndefined();
    expect(getTileAt(game, { q: 0, r: 0 }).enemyIds).toEqual([]);
    expect(getVisibleTiles(game)).toHaveLength(37);
    expect(game.player.learnedRecipeIds).toEqual(['cook-cooked-fish']);
    expect(getRecipeBookRecipes(game.player.learnedRecipeIds)).toHaveLength(1);
  });

  it('generates deterministic distant tiles for an infinite world', () => {
    const gameA = createGame(3, 'far-seed');
    const gameB = createGame(3, 'far-seed');
    const farCoord = { q: 30, r: -12 };

    expect(getTileAt(gameA, farCoord)).toEqual(getTileAt(gameB, farCoord));
  });

  it('scales enemy level with distance from the origin', () => {
    const game = createGame(3, 'far-seed');
    const near = findEnemy(game, 2, 8);
    const far = findEnemy(game, 28, 36);

    expect(near).toBeDefined();
    expect(far).toBeDefined();
    expect((far?.tier ?? 0) > (near?.tier ?? 0)).toBe(true);
  });

  it('moves onto generated adjacent tiles beyond the starting cache', () => {
    const game = createGame(3, 'loot-seed');
    game.worldTimeMs =
      ((18 * 60 + 33) / GAME_DAY_MINUTES) * GAME_DAY_DURATION_MS;
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.player.coord = { q: 1, r: 0 };

    const next = moveToTile(game, target);
    expect(next.player.coord).toEqual(target);
    expect(next.turn).toBe(1);
    expect(next.logs[0]?.text).toMatch(/^\[Year 1, Day 1, 18:33\] /);
  });

  it('claims an empty passable hex by consuming cloth and sticks', () => {
    const game = createGame(3, 'claim-hex-seed');
    game.player.inventory.push(
      {
        id: 'cloth-1',
        itemKey: 'cloth',
        name: 'Cloth',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'sticks-1',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const claimed = claimCurrentHex(game);

    expect(getTileAt(claimed, { q: 0, r: 0 }).claim).toMatchObject({
      ownerType: 'player',
      ownerId: 'player-territory',
    });
    expect(
      claimed.player.inventory.some((item) => item.itemKey === 'cloth'),
    ).toBe(false);
    expect(
      claimed.player.inventory.some((item) => item.itemKey === 'sticks'),
    ).toBe(false);
  });

  it('requires new claims to connect to the existing player territory', () => {
    let game = createGame(4, 'claim-connect-seed');
    game.player.inventory.push(
      {
        id: 'cloth-1',
        itemKey: 'cloth',
        name: 'Cloth',
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
        id: 'sticks-1',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 2,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );
    game = claimCurrentHex(game);
    game.player.coord = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      claim: undefined,
    };

    const denied = claimCurrentHex(game);

    expect(getTileAt(denied, { q: 2, r: 0 }).claim).toBeUndefined();
    expect(
      denied.logs.some((entry) =>
        /must connect to your existing border/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('limits the player territory to 5 claimed hexes', () => {
    let game = createGame(6, 'claim-limit-seed');
    game.player.inventory.push(
      {
        id: 'cloth-limit',
        itemKey: 'cloth',
        name: 'Cloth',
        quantity: 6,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'sticks-limit',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 6,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    for (const coord of [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 3, r: 0 },
      { q: 4, r: 0 },
    ]) {
      game.player.coord = coord;
      game.tiles[`${coord.q},${coord.r}`] = {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
        claim: game.tiles[`${coord.q},${coord.r}`]?.claim,
      };
      game = claimCurrentHex(game);
    }

    game.player.coord = { q: 5, r: 0 };
    game.tiles['5,0'] = {
      coord: { q: 5, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      claim: undefined,
    };

    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, { q: 5, r: 0 }).claim).toBeUndefined();
    expect(
      blocked.logs.some((entry) => /claim up to 5 hexes/i.test(entry.text)),
    ).toBe(true);
  });

  it('allows unclaiming a player hex when the remaining territory stays connected', () => {
    let game = createGame(4, 'claim-unclaim-leaf-seed');
    game.player.inventory.push(
      {
        id: 'cloth-unclaim-leaf',
        itemKey: 'cloth',
        name: 'Cloth',
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
        id: 'sticks-unclaim-leaf',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 2,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    for (const coord of [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
    ]) {
      game.player.coord = coord;
      game.tiles[`${coord.q},${coord.r}`] = {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
        claim: game.tiles[`${coord.q},${coord.r}`]?.claim,
      };
      game = claimCurrentHex(game);
    }

    game.player.coord = { q: 1, r: 0 };
    const unclaimed = claimCurrentHex(game);

    expect(getTileAt(unclaimed, { q: 1, r: 0 }).claim).toBeUndefined();
    expect(getTileAt(unclaimed, { q: 0, r: 0 }).claim?.ownerType).toBe(
      'player',
    );
    expect(
      unclaimed.logs.some((entry) =>
        /unclaim the hex at 1, 0/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('blocks unclaiming a player hex when it would split the territory', () => {
    let game = createGame(5, 'claim-unclaim-split-seed');
    game.player.inventory.push(
      {
        id: 'cloth-unclaim-split',
        itemKey: 'cloth',
        name: 'Cloth',
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
        id: 'sticks-unclaim-split',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 3,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    for (const coord of [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]) {
      game.player.coord = coord;
      game.tiles[`${coord.q},${coord.r}`] = {
        coord,
        terrain: 'plains',
        items: [],
        enemyIds: [],
        claim: game.tiles[`${coord.q},${coord.r}`]?.claim,
      };
      game = claimCurrentHex(game);
    }

    game.player.coord = { q: 1, r: 0 };
    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, { q: 1, r: 0 }).claim?.ownerType).toBe('player');
    expect(
      blocked.logs.some((entry) =>
        /would split your territory/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('generates faction territories with borders, neutral residents, and safe interiors', () => {
    const game = createGame(6, 'faction-territory-seed');
    const factionNpcTile = findFactionNpcTile(game, 36);
    const factionTownTile = findFactionTownTile(game, 36);

    expect(factionNpcTile).toBeDefined();
    expect(factionTownTile).toBeDefined();
    expect(factionTownTile?.claim?.ownerType).toBe('faction');
    expect(factionTownTile?.structure).toBe('town');
    expect(factionNpcTile?.claim?.ownerType).toBe('faction');
    expect(factionNpcTile?.claim?.npc).toBeDefined();
    expect(factionNpcTile?.enemyIds).toEqual([
      factionNpcTile?.claim?.npc?.enemyId,
    ]);
    expect(factionNpcTile?.structure).toBeUndefined();
  });

  it('finds a safe path around blocked and hostile hexes', () => {
    const game = createGame(4, 'safe-path-seed');

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-0,1-0'],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    expect(getSafePathToTile(game, { q: 2, r: 0 })).toEqual([
      { q: 1, r: -1 },
      { q: 2, r: -1 },
      { q: 2, r: 0 },
    ]);
  });

  it('moves across each step of a safe path', () => {
    const game = createGame(4, 'safe-path-move-seed');
    game.player.hunger = 100;
    game.player.thirst = 100;

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    const moved = moveAlongSafePath(game, { q: 2, r: 0 });

    expect(moved.player.coord).toEqual({ q: 2, r: 0 });
    expect(moved.turn).toBe(3);
    expect(
      moved.logs.filter((entry) => entry.kind === 'movement'),
    ).toHaveLength(3);
  });

  it('finds a safe path to a distant hostile target without crossing hostile tiles', () => {
    const game = createGame(4, 'safe-path-hostile-target-seed');

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 2,
      elite: false,
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Bandit',
      coord: { q: 2, r: 0 },
      tier: 2,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 5,
      elite: false,
    };

    expect(getSafePathToTile(game, { q: 2, r: 0 })).toEqual([
      { q: 1, r: -1 },
      { q: 2, r: -1 },
      { q: 2, r: 0 },
    ]);
  });

  it('can follow a safe path into a distant hostile target and start combat there', () => {
    const game = createGame(4, 'safe-path-hostile-combat-seed');
    game.player.hunger = 100;
    game.player.thirst = 100;

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 2,
      elite: false,
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Bandit',
      coord: { q: 2, r: 0 },
      tier: 2,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 5,
      elite: false,
    };

    const moved = moveAlongSafePath(game, { q: 2, r: 0 });

    expect(moved.player.coord).toEqual({ q: 2, r: 0 });
    expect(moved.turn).toBe(3);
    expect(moved.combat?.coord).toEqual({ q: 2, r: 0 });
    expect(moved.combat?.enemyIds).toEqual(['enemy-2,0-0']);
  });

  it('does not find a safe path into fogged hexes beyond the reveal radius', () => {
    const game = createGame(WORLD_REVEAL_RADIUS + 2, 'fogged-safe-path-seed');

    expect(
      getSafePathToTile(game, { q: WORLD_REVEAL_RADIUS + 1, r: 0 }),
    ).toBeNull();
  });

  it('does not route around obstacles through fogged hexes', () => {
    const game = createGame(WORLD_REVEAL_RADIUS + 2, 'fog-detour-path-seed');
    const edge = WORLD_REVEAL_RADIUS;
    const target = { q: edge, r: 0 };

    game.tiles[`${edge - 1},0`] = {
      coord: { q: edge - 1, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles[`${edge - 1},1`] = {
      coord: { q: edge - 1, r: 1 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles[`${edge},-1`] = {
      coord: { q: edge, r: -1 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles[`${edge},0`] = {
      coord: target,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    expect(getSafePathToTile(game, target)).toBeNull();
  });

  it('damages the player each move while hunger and thirst debuffs are active', () => {
    const game = createGame(3, 'survival-debuff-damage-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.player.coord = { q: 1, r: 0 };
    game.player.hunger = 30;
    game.player.thirst = 30;
    game.player.hp = 20;

    const moved = moveToTile(game, target);

    expect(moved.player.hp).toBe(18);
    expect(moved.logs.some((entry) => /starving/i.test(entry.text))).toBe(true);
    expect(moved.logs.some((entry) => /dehydrated/i.test(entry.text))).toBe(
      true,
    );
  });

  it('keeps the day number after rolling past 23:59', () => {
    const game = createGame(3, 'day-rollover-seed');
    game.worldTimeMs =
      GAME_DAY_DURATION_MS +
      ((18 * 60 + 33) / GAME_DAY_MINUTES) * GAME_DAY_DURATION_MS;
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.player.coord = { q: 1, r: 0 };

    const next = moveToTile(game, target);
    expect(next.logs[0]?.text).toMatch(/^\[Year 1, Day 2, 18:33\] /);
  });

  it('opens and resolves combat encounters on enemy tiles', () => {
    const game = createGame(3, 'combat-seed');
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
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    expect(encountered.combat).not.toBeNull();

    const resolved = startCombat(encountered);
    expect(resolved.combat).toBeNull();
    expect(getEnemiesAt(resolved, target)).toHaveLength(0);
    expect(
      getTileAt(resolved, target).items.every((item) =>
        ['Gold', 'Leather Scraps', 'Meat'].includes(item.name),
      ),
    ).toBe(true);
  });

  it('creates an encounter that waits for Start before battle begins', () => {
    const game = createGame(3, 'combat-start-seed');
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
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 2,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    expect(encountered.combat?.started).toBe(false);
    expect(progressCombat(encountered)).toBe(encountered);
    expect(encountered.enemies['enemy-2,0-0']?.hp).toBe(5);
    expect(
      encountered.logs.some((entry) =>
        /press start to begin the battle/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('gathers from structures, grants resources, and levels the matching skill', () => {
    const game = createGame(3, 'gather-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'tree',
      structureHp: 2,
      structureMaxHp: 2,
      items: [],
      enemyIds: [],
    };

    const chopped = interactWithStructure(game);

    expect(chopped.player.inventory.some((item) => item.name === 'Logs')).toBe(
      true,
    );
    expect(chopped.player.skills[Skill.Logging].xp).toBeGreaterThan(0);
    expect(getTileAt(chopped, { q: 0, r: 0 }).structureHp).toBe(1);

    const cleared = interactWithStructure(chopped);
    expect(getTileAt(cleared, { q: 0, r: 0 }).structure).toBeUndefined();
  });

  it('uses skill level as the extra gathering loot chance', () => {
    const game = createGame(3, 'gather-bonus-seed');
    game.player.skills[Skill.Logging].level = 100;
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'tree',
      structureHp: 5,
      structureMaxHp: 5,
      items: [],
      enemyIds: [],
    };

    const gathered = interactWithStructure(game);
    const logs = gathered.player.inventory.find((item) => item.name === 'Logs');

    expect(logs?.quantity).toBe(27);
    expect(gathered.logs.some((entry) => /extra logs/i.test(entry.text))).toBe(
      true,
    );
  });

  it('gathers herbs from herb patches', () => {
    const game = createGame(3, 'herb-patch-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'herbs',
      structureHp: 1,
      structureMaxHp: 1,
      items: [],
      enemyIds: [],
    };

    const gathered = interactWithStructure(game);

    expect(
      gathered.player.inventory.some((item) =>
        [
          'Herbs',
          'Beet',
          'Pepper',
          'Cabbage',
          'Carrot',
          'Cherry',
          'Garlic',
          'Leek',
          'Lemon',
          'Peas',
          'Tomato',
          'Aubergine',
          'Apple',
        ].includes(item.name),
      ),
    ).toBe(true);
    expect(gathered.player.skills[Skill.Gathering].xp).toBeGreaterThan(0);
    expect(getTileAt(gathered, { q: 0, r: 0 }).structure).toBeUndefined();
  });

  it('uses canonical reward item keys even when structure reward labels change', () => {
    const game = createGame(3, 'localized-gather-reward-seed');
    const treeConfig = getStructureConfig('tree');
    const gathering = treeConfig.gathering;
    if (!gathering) {
      throw new Error('Expected tree gathering config');
    }

    const originalReward = gathering.reward;
    gathering.reward = 'Bosque antiguo';

    try {
      game.tiles['0,0'] = {
        ...game.tiles['0,0'],
        structure: 'tree',
        structureHp: 1,
        structureMaxHp: 1,
        items: [],
        enemyIds: [],
      };

      const gathered = interactWithStructure(game);
      const logs = gathered.player.inventory.find(
        (item) => item.itemKey === 'logs',
      );

      expect(logs).toBeDefined();
      expect(logs?.name).toBe('Logs');
    } finally {
      gathering.reward = originalReward;
    }
  });

  it('can gather sticks from logging and stone from mining byproducts', () => {
    let sticksFound = false;
    let stoneFound = false;

    for (
      let index = 0;
      index < 300 && (!sticksFound || !stoneFound);
      index += 1
    ) {
      const treeGame = createGame(3, `tree-byproduct-${index}`);
      treeGame.tiles['0,0'] = {
        ...treeGame.tiles['0,0'],
        structure: 'tree',
        structureHp: 5,
        structureMaxHp: 5,
        items: [],
        enemyIds: [],
      };
      const chopped = interactWithStructure(treeGame);
      sticksFound ||= chopped.player.inventory.some(
        (item) => item.name === 'Sticks',
      );

      const oreGame = createGame(3, `ore-byproduct-${index}`);
      oreGame.tiles['0,0'] = {
        ...oreGame.tiles['0,0'],
        structure: 'copper-ore',
        structureHp: 6,
        structureMaxHp: 6,
        items: [],
        enemyIds: [],
      };
      const mined = interactWithStructure(oreGame);
      stoneFound ||= mined.player.inventory.some(
        (item) => item.name === 'Stone',
      );
    }

    expect(sticksFound).toBe(true);
    expect(stoneFound).toBe(true);
  });

  it('automatically skins animal enemies on kill', () => {
    const game = createGame(3, 'skinning-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'forest',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      coord: target,
      tier: 2,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);

    expect(
      getTileAt(resolved, target).items.some(
        (item) => item.name === 'Leather Scraps',
      ),
    ).toBe(true);
    expect(
      getTileAt(resolved, target).items.some((item) => item.name === 'Meat'),
    ).toBe(true);
    expect(resolved.player.skills[Skill.Skinning].xp).toBeGreaterThan(0);
  });

  it('respects global cooldown and ability cooldown between player casts', () => {
    const game = createGame(3, 'kick-cooldown-seed');
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
      name: 'Training Dummy',
      coord: target,
      tier: 1,
      hp: 50,
      maxHp: 50,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const firstCast = startCombat(encountered);
    const secondCastTooEarly = progressCombat(firstCast);

    expect(secondCastTooEarly.enemies['enemy-2,0-0']?.hp).toBe(46);
    expect(
      secondCastTooEarly.logs.filter((entry) =>
        /you kick the/i.test(entry.text),
      ),
    ).toHaveLength(1);

    const afterAbilityCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 1000,
    });

    expect(afterAbilityCooldown.enemies['enemy-2,0-0']?.hp).toBe(46);

    const afterGlobalCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 1500,
    });

    expect(afterGlobalCooldown.enemies['enemy-2,0-0']?.hp).toBe(42);
  });

  it('slows player cooldowns when thirst applies the debuff', () => {
    const game = createGame(3, 'thirst-cooldown-seed');
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
      name: 'Training Dummy',
      coord: target,
      tier: 1,
      hp: 50,
      maxHp: 50,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };
    game.player.thirst = 20;

    const encountered = moveToTile(game, target);
    const firstCast = startCombat(encountered);

    expect(firstCast.combat?.player.effectiveGlobalCooldownMs).toBe(1875);
    expect(firstCast.combat?.player.effectiveCooldownMs?.kick).toBe(1250);

    const afterBaseAbilityCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 1500,
    });

    expect(afterBaseAbilityCooldown.enemies['enemy-2,0-0']?.hp).toBe(46);

    const afterScaledCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 1875,
    });

    expect(afterScaledCooldown.enemies['enemy-2,0-0']?.hp).toBe(42);
  });

  it('lets enemies cast Kick on their own cooldown loop', () => {
    const game = createGame(3, 'enemy-kick-seed');
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
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 8,
      maxHp: 8,
      attack: 2,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const firstTick = progressCombat(startCombat(encountered));

    expect(firstTick.player.hp).toBe(29);

    const beforeSecondKick = progressCombat({
      ...firstTick,
      worldTimeMs: 1000,
    });
    expect(beforeSecondKick.player.hp).toBe(29);

    const afterSecondKick = progressCombat({ ...firstTick, worldTimeMs: 1500 });
    expect(afterSecondKick.player.hp).toBe(29);
    expect(afterSecondKick.combat).toBeNull();
  });

  it('applies random-enemy status effects to the same enemy that takes the hit', () => {
    const game = createGame(3, 'random-enemy-status-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0', 'enemy-2,0-1'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Training Dummy A',
      coord: target,
      tier: 1,
      hp: 30,
      maxHp: 30,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    };
    game.enemies['enemy-2,0-1'] = {
      id: 'enemy-2,0-1',
      name: 'Training Dummy B',
      coord: target,
      tier: 1,
      hp: 30,
      maxHp: 30,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };
    game.player.mana = 50;
    game.player.equipment.weapon = {
      id: 'test-cold-snap-wand',
      name: 'Test Cold Snap Wand',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      slot: 'weapon',
      grantedAbilityId: 'coldSnap',
    };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);
    const damagedEnemyIds =
      resolved?.combat?.enemyIds.filter((enemyId) => {
        const enemy = resolved.enemies[enemyId];
        return enemy ? enemy.hp < enemy.maxHp : false;
      }) ?? [];
    const weakenedEnemyIds =
      resolved?.combat?.enemyIds.filter((enemyId) =>
        resolved.enemies[enemyId]?.statusEffects?.some(
          (effect) => effect.id === 'weakened',
        ),
      ) ?? [];

    expect(damagedEnemyIds).toEqual(['enemy-2,0-1']);
    expect(weakenedEnemyIds).toEqual(damagedEnemyIds);
  });

  it('respawns the player at the home hex with death effects applied', () => {
    const game = createGame(3, 'death-respawn-seed');
    const target = { q: 2, r: 0 };
    game.homeHex = { q: -2, r: 1 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 20,
      maxHp: 20,
      attack: 50,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };
    game.player.hunger = 7;
    game.player.thirst = 3;
    game.player.hp = 5;
    game.player.mana = 9;

    const respawned = startCombat(moveToTile(game, target));
    const stats = getPlayerStats(respawned.player);

    expect(respawned.player.coord).toEqual(game.homeHex);
    expect(respawned.player.hunger).toBe(100);
    expect(respawned.player.thirst).toBe(100);
    expect(respawned.player.hp).toBe(1);
    expect(respawned.player.mana).toBe(1);
    expect(stats.maxHp).toBe(Math.floor(respawned.player.baseMaxHp * 0.9));
    expect(respawned.player.statusEffects.map((effect) => effect.id)).toEqual([
      'recentDeath',
      'restoration',
    ]);
  });

  it('ticks restoration once per second and removes it after 100 seconds', () => {
    const game = createGame(3, 'death-restoration-seed');
    game.player.baseMaxHp = 1_000;
    game.player.baseMaxMana = 100;
    game.player.hp = 1;
    game.player.mana = 1;
    game.player.statusEffects = [
      { id: 'recentDeath' },
      {
        id: 'restoration',
        expiresAt: 100_000,
        tickIntervalMs: 1_000,
        lastProcessedAt: 0,
      },
    ];

    const afterOneSecond = syncPlayerStatusEffects(game, 1_000);
    expect(afterOneSecond.player.hp).toBe(10);
    expect(afterOneSecond.player.mana).toBe(2);
    expect(
      afterOneSecond.player.statusEffects.some(
        (effect) => effect.id === 'restoration',
      ),
    ).toBe(true);

    const afterExpiry = syncPlayerStatusEffects(afterOneSecond, 100_000);
    expect(afterExpiry.player.hp).toBe(900);
    expect(afterExpiry.player.mana).toBe(100);
    expect(
      afterExpiry.player.statusEffects.some(
        (effect) => effect.id === 'restoration',
      ),
    ).toBe(false);
    expect(
      afterExpiry.player.statusEffects.some(
        (effect) => effect.id === 'recentDeath',
      ),
    ).toBe(true);
  });

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

  it('clears the home hex when home is set', () => {
    const game = createGame(3, 'set-home-empty-seed');
    game.player.coord = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'resource-gold-home',
          name: 'Gold',
          itemKey: 'gold',
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
      structure: 'camp',
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const next = setHomeHex(game);
    const homeTile = getTileAt(next, { q: 1, r: 0 });

    expect(next.homeHex).toEqual({ q: 1, r: 0 });
    expect(homeTile.structure).toBeUndefined();
    expect(homeTile.items).toEqual([]);
    expect(homeTile.enemyIds).toEqual([]);
    expect(next.enemies['enemy-1,0-0']).toBeUndefined();
  });

  it('prevents setting home on another territory', () => {
    const game = createGame(3, 'set-home-claimed-seed');
    game.player.coord = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'resource-gold-home',
          name: 'Gold',
          itemKey: 'gold',
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
      structure: 'camp',
      enemyIds: ['enemy-1,0-0'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const next = setHomeHex(game);
    const blockedTile = getTileAt(next, { q: 1, r: 0 });

    expect(next.homeHex).toEqual(game.homeHex);
    expect(blockedTile).toMatchObject({
      terrain: 'plains',
      structure: 'camp',
      items: [
        {
          id: 'resource-gold-home',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 4,
        },
      ],
      enemyIds: ['enemy-1,0-0'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
      },
    });
    expect(next.enemies['enemy-1,0-0']).toBeDefined();
    expect(
      next.logs.some((entry) =>
        entry.text.includes(t('game.message.home.blockedByTerritory')),
      ),
    ).toBe(true);
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

  it('treats non-center world boss footprint hexes as occupied until the boss dies', () => {
    const { game, center, bossId } = createPlacedWorldBossEncounter();
    const footprintHex = getVisibleTiles({
      ...game,
      player: { ...game.player, coord: center },
    }).find((tile) => hexDistance(tile.coord, center) === 1)?.coord;

    expect(footprintHex).toBeDefined();

    game.player.coord = footprintHex!;
    game.player.inventory.push(
      {
        id: 'claim-cloth',
        itemKey: 'cloth',
        name: 'Cloth',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        thirst: 0,
      },
      {
        id: 'claim-sticks',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
        thirst: 0,
      },
    );

    const blocked = claimCurrentHex(game);
    expect(getTileAt(blocked, footprintHex!).claim).toBeUndefined();
    expect(blocked.logs[0]?.text).toContain(
      t('game.message.claim.status.emptyOnly'),
    );

    delete game.enemies[bossId];
    game.tiles[`${center.q},${center.r}`] = {
      ...getTileAt(game, center),
      enemyIds: [],
    };

    const claimed = claimCurrentHex(game);
    expect(getTileAt(claimed, footprintHex!).claim?.ownerType).toBe('player');
  });

  it('reserves generated boss footprint hexes even before the center tile is loaded', () => {
    const { game, center } = createGeneratedWorldBossEncounter();
    const footprintHex =
      hexNeighbors(center).find((coord) => {
        const tile = buildTile(game.seed, coord);
        return tile.terrain !== 'rift' && tile.terrain !== 'mountain';
      }) ?? hexNeighbors(center)[0]!;

    game.player.coord = footprintHex;
    game.tiles[hexKey(footprintHex)] = buildTile(game.seed, footprintHex);
    delete game.tiles[hexKey(center)];
    game.player.inventory.push(
      {
        id: 'generated-claim-cloth',
        itemKey: 'cloth',
        name: 'Cloth',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'generated-claim-sticks',
        itemKey: 'sticks',
        name: 'Sticks',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const blocked = claimCurrentHex(game);

    expect(getTileAt(blocked, footprintHex).claim).toBeUndefined();
    expect(blocked.logs[0]?.text).toContain(
      t('game.message.claim.status.emptyOnly'),
    );
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

  it('lets the player buy items from town stock', () => {
    const game = createGame(3, 'town-stock-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'town' };
    game.player.inventory.push({
      id: 'resource-gold-1',
      name: 'Gold',
      itemKey: 'gold',
      quantity: 40,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const stock = getTownStock(game);
    const bought = buyTownItem(game, stock[0].item.id);

    expect(stock.length).toBeGreaterThan(0);
    expect(
      bought.player.inventory.some((item) => item.name === stock[0].item.name),
    ).toBe(true);
    expect(getGoldAmount(bought.player.inventory)).toBeLessThan(40);
  });

  it('leaves loot on the tile until the player takes it', () => {
    const game = createGame(3, 'manual-loot-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [
        {
          id: 'resource-gold-1',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 12,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
    };

    const taken = takeTileItem(game, 'resource-gold-1');

    expect(getGoldAmount(taken.player.inventory)).toBe(12);
    expect(getTileAt(taken, { q: 0, r: 0 }).items).toHaveLength(0);
  });

  it('takes all loot from the current tile at once', () => {
    const game = createGame(3, 'take-all-loot-seed');
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [
        {
          id: 'food-1',
          name: 'Trail Ration',
          itemKey: 'trail-ration',
          quantity: 2,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 10,
          hunger: 15,
        },
        {
          id: 'resource-gold-1',
          name: 'Gold',
          itemKey: 'gold',
          quantity: 7,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
    };

    const taken = takeAllTileItems(game);

    expect(getGoldAmount(taken.player.inventory)).toBe(7);
    expect(
      taken.player.inventory.find((item) => item.name === 'Trail Ration')
        ?.quantity,
    ).toBe(4);
    expect(getTileAt(taken, { q: 0, r: 0 }).items).toHaveLength(0);
  });

  it('can use consumables and drop inventory items onto the ground', () => {
    const game = createGame(3, 'use-drop-seed');
    game.player.hp = 20;

    const used = useItem(game, 'starter-ration');
    expect(used.player.hunger).toBe(100);
    expect(
      used.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);

    const dropped = dropInventoryItem(used, 'starter-ration');
    expect(
      dropped.player.inventory.find((item) => item.id === 'starter-ration'),
    ).toBeUndefined();
    expect(
      getTileAt(dropped, { q: 0, r: 0 }).items.find(
        (item) => item.id === 'starter-ration',
      ),
    ).toBeDefined();
  });

  it('does not consume a consumable when none of its effects would apply', () => {
    const game = createGame(3, 'use-no-effect-seed');
    game.player.hp = getPlayerStats(game.player).maxHp;
    game.player.hunger = 100;
    game.player.thirst = 100;

    const untouched = useItem(game, 'starter-ration');

    expect(
      untouched.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(2);
    expect(untouched.logs[0]?.text).toContain(
      'Trail Ration would have no effect right now.',
    );
  });

  it('applies a shared consumable cooldown after using one', () => {
    const game = createGame(3, 'use-cooldown-seed');
    game.player.hp = 20;
    game.player.hunger = 80;

    const used = useItem(game, 'starter-ration');

    expect(used.player.consumableCooldownEndsAt).toBe(2_000);
    expect(
      used.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);

    const blocked = useItem(used, 'starter-ration');

    expect(
      blocked.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(1);
    expect(blocked.logs[0]?.text).toContain(
      'Consumables are on cooldown for 2s.',
    );

    const ready = {
      ...used,
      worldTimeMs: 2_000,
    };
    const usedAgain = useItem(ready, 'starter-ration');

    expect(
      usedAgain.player.inventory.find((item) => item.id === 'starter-ration'),
    ).toBeUndefined();
  });

  it('applies the shared consumable cooldown after using a home scroll', () => {
    const game = createGame(3, 'home-scroll-cooldown-seed');
    game.player.coord = { q: 2, r: -1 };
    game.homeHex = { q: 0, r: 0 };
    game.player.hp = 20;
    game.player.hunger = 80;
    game.player.inventory.push({
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
    });

    const usedScroll = useItem(game, 'home-scroll-1');

    expect(usedScroll.player.coord).toEqual({ q: 0, r: 0 });
    expect(usedScroll.player.consumableCooldownEndsAt).toBe(2_000);
    expect(
      usedScroll.player.inventory.find((item) => item.id === 'home-scroll-1'),
    ).toBeUndefined();

    const blocked = useItem(usedScroll, 'starter-ration');

    expect(
      blocked.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(2);
    expect(blocked.logs[0]?.text).toContain(
      'Consumables are on cooldown for 2s.',
    );
  });

  it('uses health and mana potions for 10 percent of the matching max stat', () => {
    const game = createGame(3, 'use-potions-seed');
    const hpPotion = buildItemFromConfig('health-potion', {
      id: 'health-potion-1',
    });
    const mpPotion = buildItemFromConfig('mana-potion', {
      id: 'mana-potion-1',
    });
    game.player.inventory.push(hpPotion, mpPotion);
    game.player.hp = 25;
    game.player.mana = 8;

    const healed = useItem(game, 'health-potion-1');
    expect(healed.player.hp).toBe(28);
    expect(
      healed.player.inventory.find((item) => item.id === 'health-potion-1'),
    ).toBeUndefined();

    const restored = useItem(
      {
        ...healed,
        worldTimeMs: 2_000,
      },
      'mana-potion-1',
    );
    expect(restored.player.mana).toBe(10);
    expect(
      restored.player.inventory.find((item) => item.id === 'mana-potion-1'),
    ).toBeUndefined();
  });

  it('uses a hearthshard wayscroll to return to the home hex', () => {
    const game = createGame(3, 'home-scroll-use-seed');
    game.homeHex = { q: -2, r: 1 };
    game.player.coord = { q: 2, r: -1 };
    game.player.inventory.push({
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
    });

    const returned = useItem(game, 'home-scroll-1');

    expect(returned.player.coord).toEqual(game.homeHex);
    expect(
      returned.player.inventory.some((item) => item.id === 'home-scroll-1'),
    ).toBe(false);
    expect(
      returned.logs.some((entry) => /returns you home/i.test(entry.text)),
    ).toBe(true);
  });

  it('can drop a hearthshard wayscroll from a defeated enemy', () => {
    let dropped: GameState | null = null;

    for (let attempt = 0; attempt < 800; attempt += 1) {
      const game = createGame(3, `home-scroll-drop-seed-${attempt}`);
      const target = { q: 2, r: 0 };
      game.homeHex = { q: -2, r: 1 };
      game.tiles['2,0'] = {
        coord: target,
        terrain: 'plains',
        items: [],
        structure: undefined,
        enemyIds: ['enemy-2,0-0'],
      };
      game.enemies['enemy-2,0-0'] = {
        id: 'enemy-2,0-0',
        name: 'Wolf',
        coord: target,
        tier: 1,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 1,
        elite: false,
      };
      game.player.coord = { q: 1, r: 0 };

      const encountered = moveToTile(game, target);
      const resolved = startCombat(encountered);
      const tile = getTileAt(resolved, target);
      if (
        tile.items.some((item) => item.name === t(HOME_SCROLL_ITEM_NAME_KEY))
      ) {
        dropped = resolved;
        break;
      }
    }

    expect(dropped).not.toBeNull();
    expect(
      getTileAt(dropped!, { q: 2, r: 0 }).items.some(
        (item) => item.name === t(HOME_SCROLL_ITEM_NAME_KEY),
      ),
    ).toBe(true);
  });

  it('cooks raw fish with available burnable fuel and levels cooking', () => {
    const game = createGame(3, 'cooking-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'camp' };
    game.player.inventory.push(
      {
        id: 'raw-fish-1',
        name: 'Raw Fish',
        itemKey: 'raw-fish',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'coal-1',
        name: 'Coal',
        itemKey: 'coal',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const cooked = craftRecipe(game, 'cook-cooked-fish');

    expect(
      cooked.player.inventory.some((item) => item.name === 'Cooked Fish'),
    ).toBe(true);
    expect(
      cooked.player.inventory.find((item) => item.itemKey === 'raw-fish')
        ?.quantity,
    ).toBe(9);
    expect(
      cooked.player.inventory.find((item) => item.itemKey === 'coal')?.quantity,
    ).toBe(9);
    expect(cooked.player.skills[Skill.Cooking].xp).toBeGreaterThan(0);
  });

  it('crafts slot gear from recipe requirements and levels crafting', () => {
    const game = createGame(3, 'crafting-seed');
    game.player.level = 12;
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
    game.player.learnedRecipeIds.push('craft-icon-axe-01');
    game.player.inventory.push(
      {
        id: 'ingot-1',
        name: 'Iron Ingot',
        itemKey: 'iron-ingot',
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'sticks-1',
        name: 'Sticks',
        itemKey: 'sticks',
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const crafted = craftRecipe(game, 'craft-icon-axe-01');
    const craftedWeapon = crafted.player.inventory.find(
      (item) => item.itemKey === 'icon-axe-01',
    );

    expect(craftedWeapon).toBeDefined();
    expect(craftedWeapon?.tier).toBe(game.player.level);
    expect(craftedWeapon?.power).toBeGreaterThan(
      buildItemFromConfig('icon-axe-01').power,
    );
    expect(crafted.player.skills[Skill.Crafting].xp).toBeGreaterThan(0);
  });

  it('rolls crafted gear through the shared rarity cascade', () => {
    const upgradedCraft = Array.from({ length: 64 }, (_, index) => index)
      .map((index) => {
        const game = createGame(3, `crafted-rarity-${index}`);
        game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
        game.player.learnedRecipeIds.push('craft-icon-axe-01');
        game.player.inventory.push(
          buildItemFromConfig('iron-ingot', { id: 'ingot-1', quantity: 20 }),
          buildItemFromConfig('sticks', { id: 'sticks-1', quantity: 20 }),
        );

        return craftRecipe(game, 'craft-icon-axe-01').player.inventory.find(
          (item) => item.itemKey === 'icon-axe-01' && item.rarity !== 'common',
        );
      })
      .find(Boolean);

    expect(upgradedCraft).toBeDefined();
  });

  it('smelts ore into ingots at a furnace and levels smelting', () => {
    const game = createGame(3, 'smelting-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'furnace' };
    game.player.learnedRecipeIds.push('smelt-copper-ingot');
    game.player.inventory.push(
      {
        id: 'ore-1',
        name: 'Copper Ore',
        itemKey: 'copper-ore',
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'coal-1',
        name: 'Coal',
        itemKey: 'coal',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const smelted = craftRecipe(game, 'smelt-copper-ingot');

    expect(
      smelted.player.inventory.some((item) => item.itemKey === 'copper-ingot'),
    ).toBe(true);
    expect(
      smelted.player.inventory.find((item) => item.itemKey === 'copper-ore')
        ?.quantity,
    ).toBe(19);
    expect(
      smelted.player.inventory.find((item) => item.itemKey === 'coal')
        ?.quantity,
    ).toBe(9);
    expect(smelted.player.skills[Skill.Smelting].xp).toBeGreaterThan(0);
  });

  it('increases cooking and smelting recipe output from profession levels', () => {
    const cookingGame = createGame(3, 'cooking-output-seed');
    cookingGame.tiles['0,0'] = {
      ...cookingGame.tiles['0,0'],
      structure: 'camp',
    };
    cookingGame.player.learnedRecipeIds.push('cook-cooked-fish');
    cookingGame.player.skills[Skill.Cooking].level = 6;
    cookingGame.player.inventory.push(
      buildItemFromConfig('raw-fish', { id: 'raw-fish-1', quantity: 1 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 1 }),
    );

    const cooked = craftRecipe(cookingGame, 'cook-cooked-fish');

    expect(
      cooked.player.inventory.find((item) => item.itemKey === 'cooked-fish')
        ?.quantity,
    ).toBe(2);

    const smeltingGame = createGame(3, 'smelting-output-seed');
    smeltingGame.tiles['0,0'] = {
      ...smeltingGame.tiles['0,0'],
      structure: 'furnace',
    };
    smeltingGame.player.learnedRecipeIds.push('smelt-copper-ingot');
    smeltingGame.player.skills[Skill.Smelting].level = 6;
    smeltingGame.player.inventory.push(
      buildItemFromConfig('copper-ore', { id: 'ore-1', quantity: 1 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 1 }),
    );

    const smelted = craftRecipe(smeltingGame, 'smelt-copper-ingot');

    expect(
      smelted.player.inventory.find((item) => item.itemKey === 'copper-ingot')
        ?.quantity,
    ).toBe(2);
  });

  it('can craft up to a fixed batch size when requested', () => {
    const game = createGame(3, 'craft-batch-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'camp' };
    game.player.learnedRecipeIds.push('cook-cooked-fish');
    game.player.inventory.push(
      buildItemFromConfig('raw-fish', { id: 'raw-fish-1', quantity: 5 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 5 }),
    );

    const crafted = craftRecipe(game, 'cook-cooked-fish', 5);

    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'cooked-fish')
        ?.quantity,
    ).toBe(5);
    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'raw-fish'),
    ).toBeUndefined();
  });

  it('can craft the maximum possible amount when requested', () => {
    const game = createGame(3, 'craft-max-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'camp' };
    game.player.learnedRecipeIds.push('cook-cooked-fish');
    game.player.inventory.push(
      buildItemFromConfig('raw-fish', { id: 'raw-fish-1', quantity: 7 }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 3 }),
    );

    const crafted = craftRecipe(game, 'cook-cooked-fish', 'max');

    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'cooked-fish')
        ?.quantity,
    ).toBe(3);
    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'coal'),
    ).toBeUndefined();
    expect(
      crafted.player.inventory.find((item) => item.itemKey === 'raw-fish')
        ?.quantity,
    ).toBe(4);
  });

  it('smelts the expanded ore set into ingots with one iron recipe', () => {
    const game = createGame(3, 'expanded-smelting-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'furnace' };
    game.player.learnedRecipeIds.push(
      'smelt-tin-ingot',
      'smelt-iron-ingot',
      'smelt-gold-ingot',
      'smelt-platinum-ingot',
    );
    game.player.inventory.push(
      buildItemFromConfig('tin-ore', { id: 'tin-ore-1', quantity: 20 }),
      buildItemFromConfig('iron-ore', { id: 'iron-ore-1', quantity: 20 }),
      buildItemFromConfig('gold-ore', { id: 'gold-ore-1', quantity: 30 }),
      buildItemFromConfig('platinum-ore', {
        id: 'platinum-ore-1',
        quantity: 40,
      }),
      buildItemFromConfig('coal', { id: 'coal-1', quantity: 40 }),
    );

    const smeltedTin = craftRecipe(game, 'smelt-tin-ingot');
    const smeltedIron = craftRecipe(smeltedTin, 'smelt-iron-ingot');
    const smeltedGold = craftRecipe(smeltedIron, 'smelt-gold-ingot');
    const smeltedPlatinum = craftRecipe(smeltedGold, 'smelt-platinum-ingot');

    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'tin-ingot',
      ),
    ).toBe(true);
    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'iron-ingot',
      ),
    ).toBe(true);
    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'gold-ingot',
      ),
    ).toBe(true);
    expect(
      smeltedPlatinum.player.inventory.some(
        (item) => item.itemKey === 'platinum-ingot',
      ),
    ).toBe(true);
    expect(
      getRecipeBookEntries(smeltedPlatinum.player.learnedRecipeIds).filter(
        (entry) => entry.id.startsWith('smelt-iron-ingot'),
      ),
    ).toHaveLength(1);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'tin-ore',
      )?.quantity,
    ).toBe(19);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'iron-ore',
      )?.quantity,
    ).toBe(19);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'gold-ore',
      )?.quantity,
    ).toBe(29);
    expect(
      smeltedPlatinum.player.inventory.find(
        (item) => item.itemKey === 'platinum-ore',
      )?.quantity,
    ).toBe(39);
    expect(
      smeltedPlatinum.player.inventory.find((item) => item.itemKey === 'coal')
        ?.quantity,
    ).toBe(36);
  });

  it('requires the matching hex type for cooking and crafting recipes', () => {
    const game = createGame(3, 'recipe-station-seed');
    game.player.inventory.push(
      {
        id: 'raw-fish-1',
        name: 'Raw Fish',
        itemKey: 'raw-fish',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'coal-1',
        name: 'Coal',
        itemKey: 'coal',
        quantity: 1,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const denied = craftRecipe(game, 'cook-cooked-fish');

    expect(denied.logs[0]?.text).toMatch(/stand at a campfire/i);
  });

  it('requires learning a recipe before crafting it', () => {
    const game = createGame(3, 'recipe-learning-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'workshop' };
    game.player.inventory.push(
      {
        id: 'ingot-1',
        name: 'Iron Ingot',
        itemKey: 'iron-ingot',
        quantity: 20,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'sticks-1',
        name: 'Sticks',
        itemKey: 'sticks',
        quantity: 10,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    );

    const denied = craftRecipe(game, 'craft-icon-axe-01');

    expect(denied.logs[0]?.text).toMatch(/have not learned/i);
  });

  it('learns a dropped recipe page when used', () => {
    const game = createGame(3, 'recipe-use-seed');
    const originalLearnedRecipeIds = game.player.learnedRecipeIds;
    game.player.inventory.push({
      id: 'recipe-craft-weapon',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const learned = useItem(game, 'recipe-craft-weapon');

    expect(learned.player.learnedRecipeIds).toContain('craft-icon-axe-01');
    expect(learned.player.learnedRecipeIds).not.toBe(originalLearnedRecipeIds);
    expect(
      learned.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon',
      ),
    ).toBe(false);
  });

  it('does not consume an already learned recipe page when used', () => {
    const game = createGame(3, 'recipe-known-seed');
    game.player.learnedRecipeIds = ['craft-icon-axe-01'];
    game.player.inventory.push({
      id: 'recipe-craft-weapon-known',
      recipeId: 'craft-icon-axe-01',
      name: 'Recipe: Axe 01',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    });

    const unchanged = useItem(game, 'recipe-craft-weapon-known');

    expect(unchanged.player.learnedRecipeIds).toEqual(['craft-icon-axe-01']);
    expect(
      unchanged.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-known',
      ),
    ).toBe(true);
    expect(unchanged.logs[0]?.text).toContain('already know');
  });

  it('sells recipe pages in town for elevated value', () => {
    const game = createGame(3, 'sell-recipe-page-seed');
    game.tiles['0,0'] = {
      ...getTileAt(game, { q: 0, r: 0 }),
      structure: 'town',
    };
    game.player.inventory.push({
      id: 'recipe-craft-weapon-sell',
      recipeId: 'craft-icon-axe-01',
      icon: 'recipe.svg',
      name: 'Recipe: Axe 01',
      tags: [GameTag.ItemResource, GameTag.ItemRecipe],
      quantity: 1,
      tier: 2,
      rarity: 'uncommon',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
    });

    const sold = sellInventoryItem(game, 'recipe-craft-weapon-sell');

    expect(
      sold.player.inventory.some(
        (item) => item.id === 'recipe-craft-weapon-sell',
      ),
    ).toBe(false);
    expect(getGoldAmount(sold.player.inventory)).toBe(40);
    expect(sold.logs[0]?.text).toContain('Recipe: Axe 01');
    expect(sold.logs[0]?.text).toContain('40 gold');
  });

  it('can drop an unlearned recipe from enemies', () => {
    let dropped = false;

    for (let index = 0; index < 200; index += 1) {
      const game = createGame(3, `recipe-drop-seed-${index}`);
      const target = { q: 2, r: 0 };
      game.player.learnedRecipeIds = ['cook-cooked-fish'];
      game.tiles['2,0'] = {
        coord: target,
        terrain: 'plains',
        items: [],
        structure: undefined,
        enemyIds: ['enemy-2,0-0'],
      };
      game.enemies['enemy-2,0-0'] = {
        id: 'enemy-2,0-0',
        name: 'Bandit',
        coord: target,
        tier: 4,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 5,
        elite: true,
      };
      game.player.coord = { q: 1, r: 0 };

      const encountered = moveToTile(game, target);
      const resolved = startCombat(encountered);

      if (getTileAt(resolved, target).items.some((item) => item.recipeId)) {
        dropped = true;
        break;
      }
    }

    expect(dropped).toBe(true);
  });

  it('unlocks the matching recipe book entry after looting and using an enemy recipe page', () => {
    let resolvedWithRecipe: GameState | null = null;
    let droppedRecipeId: string | null = null;

    for (let index = 0; index < 400; index += 1) {
      const game = createGame(3, `recipe-loot-use-seed-${index}`);
      const target = { q: 2, r: 0 };
      game.player.learnedRecipeIds = ['cook-cooked-fish'];
      game.tiles['2,0'] = {
        coord: target,
        terrain: 'plains',
        items: [],
        structure: undefined,
        enemyIds: ['enemy-2,0-0'],
      };
      game.enemies['enemy-2,0-0'] = {
        id: 'enemy-2,0-0',
        name: 'Bandit',
        coord: target,
        tier: 4,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 5,
        elite: true,
      };
      game.player.coord = { q: 1, r: 0 };

      const encountered = moveToTile(game, target);
      const resolved = startCombat(encountered);
      const recipePage = getTileAt(resolved, target).items.find((item) =>
        Boolean(item.recipeId),
      );
      if (!recipePage?.recipeId) continue;

      resolvedWithRecipe = resolved;
      droppedRecipeId = recipePage.recipeId;
      break;
    }

    expect(resolvedWithRecipe).not.toBeNull();
    expect(droppedRecipeId).not.toBeNull();

    const recipePage = getTileAt(resolvedWithRecipe!, {
      q: 2,
      r: 0,
    }).items.find((item) => item.recipeId === droppedRecipeId);
    expect(recipePage).toBeDefined();
    expect(recipePage?.itemKey).toBe('recipe-book');
    expect(recipePage?.icon).toBeTruthy();

    const looted = takeTileItem(resolvedWithRecipe!, recipePage!.id);
    const learned = useItem(looted, recipePage!.id);

    expect(learned.player.learnedRecipeIds).toContain(droppedRecipeId);
    expect(
      getRecipeBookEntries(learned.player.learnedRecipeIds).some(
        (entry) => entry.id === droppedRecipeId && entry.learned,
      ),
    ).toBe(true);
  });

  it('exposes learned and unlearned recipe entries for the recipe book', () => {
    const entries = getRecipeBookEntries(['cook-cooked-fish']);

    expect(
      entries.some((entry) => entry.id === 'cook-cooked-fish' && entry.learned),
    ).toBe(true);
    expect(
      entries.some(
        (entry) => entry.id === 'craft-icon-helmet-01' && !entry.learned,
      ),
    ).toBe(true);
    expect(entries.some((entry) => entry.id === 'craft-weapon')).toBe(false);
  });

  it('lets every enemy on the tile retaliate during combat', () => {
    const game = createGame(3, 'group-combat-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0', 'enemy-2,0-1'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 20,
      maxHp: 20,
      attack: 2,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-2,0-1'] = {
      id: 'enemy-2,0-1',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 20,
      maxHp: 20,
      attack: 3,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolvedRound = startCombat(encountered);

    expect(resolvedRound.combat?.enemyIds).toHaveLength(2);
    expect(resolvedRound.player.hp).toBe(27);
  });

  it('caps the log at 100 messages', () => {
    let game = createGame(3, 'log-cap-seed');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      items: [],
      enemyIds: [],
    };
    game.player.hunger = 999;
    game.player.thirst = 999;

    for (let turn = 0; turn < 120; turn += 1) {
      game = moveToTile(game, turn % 2 === 0 ? { q: 1, r: 0 } : { q: 0, r: 0 });
    }

    expect(game.logs).toHaveLength(100);
    expect(game.logs[0]?.text).toMatch(/you travel to/i);
  });

  it('caps player level at 100 and gains infinite mastery levels after that', () => {
    const game = createGame(3, 'mastery-seed');
    const level100Xp = 40 + 99 * 25;
    const firstMasteryXp = (40 + 100 * 25) * 20;
    const secondMasteryXp = (40 + 101 * 25) * 20;

    game.player.level = 99;
    game.player.xp = 0;
    game.player.masteryLevel = 0;
    game.enemies['enemy-1'] = {
      id: 'enemy-1',
      name: 'Training Dummy',
      coord: { q: 0, r: 0 },
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: level100Xp + firstMasteryXp + secondMasteryXp,
      elite: false,
    };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      enemyIds: ['enemy-1'],
      items: [],
    };
    game.combat = makeCombatState(
      { q: 0, r: 0 },
      ['enemy-1'],
      game.worldTimeMs,
    );

    const resolved = progressCombat(game);
    const stats = getPlayerStats(resolved.player);

    expect(resolved.player.level).toBe(100);
    expect(resolved.player.masteryLevel).toBe(2);
    expect(resolved.player.xp).toBe(0);
    expect(stats.nextLevelXp).toBe((40 + 102 * 25) * 20);
    expect(
      resolved.logs.some((entry) => /mastery level 2/i.test(entry.text)),
    ).toBe(true);
  });

  it('does not restore hp or mana on level up', () => {
    const game = createGame(3, 'level-up-keeps-resources-seed');
    const target = { q: 2, r: 0 };
    game.player.hp = 9;
    game.player.mana = 4;
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-level-up'],
    };
    game.enemies['enemy-level-up'] = {
      id: 'enemy-level-up',
      name: 'Training Dummy',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 65,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);
    const stats = getPlayerStats(resolved.player);

    expect(resolved.player.level).toBe(2);
    expect(resolved.player.hp).toBe(9);
    expect(resolved.player.mana).toBe(4);
    expect(stats.maxHp).toBe(36);
    expect(stats.maxMana).toBe(14);
  });

  it('supports many equipment slots and artifact loadouts', () => {
    const game = createGame(3, 'equip-seed');
    const inventory: Item[] = EQUIPMENT_SLOTS.map((slot, index) => ({
      id: `item-${slot}`,
      slot,
      name: `Item ${index}`,
      quantity: 1,
      tier: 2,
      rarity: 'rare',
      power:
        slot === 'weapon' ||
        slot === 'offhand' ||
        slot === 'ringLeft' ||
        slot === 'ringRight' ||
        slot === 'amulet'
          ? 3
          : 0,
      defense: slot === 'weapon' ? 0 : 2,
      maxHp: 1,
      healing: 0,
      hunger: 0,
    }));

    game.player.inventory = inventory;
    const equipped = inventory.reduce(
      (current, item) => equipItem(current, item.id),
      game,
    );

    expect(Object.keys(equipped.player.equipment)).toHaveLength(
      EQUIPMENT_SLOTS.length,
    );
    expect(getPlayerStats(equipped.player).defense).toBeGreaterThan(
      getPlayerStats(game.player).defense,
    );
  });

  it('sorts, prospects, and sells inventory into gold/resources', () => {
    const game = createGame(3, 'trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
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
      {
        id: 'food-1',
        name: 'Trail Ration',
        itemKey: 'trail-ration',
        quantity: 2,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 8,
        hunger: 12,
      },
    ];
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'forge' };

    const sorted = sortInventory(game);
    expect(getItemCategory(sorted.player.inventory[0]!)).toBe('weapon');
    expect(getItemCategory(sorted.player.inventory[1]!)).toBe('consumable');

    const sold = sellAllItems(sorted);
    expect(sold.logs[0]?.text).toMatch(/only while standing in town/i);

    const prospected = prospectInventory(sorted);
    expect(
      prospected.player.inventory.some(
        (item) => getItemCategory(item) === 'resource',
      ),
    ).toBe(true);

    expect(
      prospected.player.inventory.some(
        (item) => getItemCategory(item) === 'resource',
      ),
    ).toBe(true);

    sorted.tiles['0,0'] = { ...sorted.tiles['0,0'], structure: 'town' };
    const soldInTown = sellAllItems(sorted);
    expect(getGoldAmount(soldInTown.player.inventory)).toBeGreaterThan(0);
  });

  it('keeps locked equippable items out of prospecting and selling', () => {
    const game = createGame(3, 'locked-trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
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
      {
        id: 'weapon-2',
        slot: 'weapon',
        name: 'Spare Blade',
        quantity: 1,
        tier: 2,
        rarity: 'common',
        power: 3,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const locked = setInventoryItemLocked(game, 'weapon-1', true);
    locked.tiles['0,0'] = { ...locked.tiles['0,0'], structure: 'forge' };

    const prospected = prospectInventory(locked);
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-1'),
    ).toBe(true);
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-2'),
    ).toBe(false);

    prospected.tiles['0,0'] = { ...prospected.tiles['0,0'], structure: 'town' };
    const sold = sellAllItems(prospected);
    expect(sold.player.inventory.some((item) => item.id === 'weapon-1')).toBe(
      true,
    );
  });

  it('prospects and sells a single inventory item from the current hex', () => {
    const game = createGame(3, 'single-trade-seed');
    game.player.inventory = [
      {
        id: 'weapon-1',
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
      {
        id: 'weapon-2',
        slot: 'weapon',
        name: 'Spare Blade',
        quantity: 1,
        tier: 2,
        rarity: 'common',
        power: 3,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'forge' };
    const prospected = prospectInventoryItem(game, 'weapon-1');
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-1'),
    ).toBe(false);
    expect(
      prospected.player.inventory.some((item) => item.id === 'weapon-2'),
    ).toBe(true);
    expect(
      prospected.player.inventory.some((item) => item.itemKey === 'iron-ore'),
    ).toBe(true);

    prospected.tiles['0,0'] = { ...prospected.tiles['0,0'], structure: 'town' };
    const sold = sellInventoryItem(prospected, 'weapon-2');
    expect(sold.player.inventory.some((item) => item.id === 'weapon-2')).toBe(
      false,
    );
    expect(getGoldAmount(sold.player.inventory)).toBeGreaterThan(0);
  });

  it('merges duplicate gold stacks when sorting inventory', () => {
    const game = createGame(3, 'gold-sort-seed');
    game.player.inventory = [
      {
        id: 'resource-gold-1',
        name: 'Gold',
        itemKey: 'gold',
        quantity: 5,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
      {
        id: 'resource-gold-1-copy',
        name: 'Gold',
        itemKey: 'gold',
        quantity: 7,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const sorted = sortInventory(game);

    expect(getGoldAmount(sorted.player.inventory)).toBe(12);
    expect(
      sorted.player.inventory.filter(
        (item) => getItemCategory(item) === 'resource' && item.name === 'Gold',
      ),
    ).toHaveLength(1);
  });

  it('assigns unique ids when buying the same non-stackable town item twice', () => {
    const game = createGame(3, 'town-duplicate-id-seed');
    game.tiles['0,0'] = { ...game.tiles['0,0'], structure: 'town' };
    game.player.inventory = [
      {
        id: 'resource-gold-town-test',
        name: 'Gold',
        itemKey: 'gold',
        quantity: 100,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ];

    const stock = getTownStock(game);
    const hood = stock.find((entry) => entry.item.name === 'Scout Hood');
    expect(hood).toBeDefined();

    const boughtOnce = buyTownItem(game, hood!.item.id);
    const boughtTwice = buyTownItem(boughtOnce, hood!.item.id);
    const hoodIds = boughtTwice.player.inventory
      .filter((item) => item.name === 'Scout Hood')
      .map((item) => item.id);

    expect(hoodIds).toHaveLength(2);
    expect(new Set(hoodIds).size).toBe(2);
  });

});

function findEnemy(
  game: ReturnType<typeof createGame>,
  min: number,
  max: number,
) {
  for (let q = -max; q <= max; q += 1) {
    for (let r = -max; r <= max; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance < min || distance > max) continue;
      const enemy = getEnemyAt(game, { q, r });
      if (enemy) return enemy;
    }
  }

  return undefined;
}

function findFactionNpcTile(
  game: ReturnType<typeof createGame>,
  maxDistance: number,
) {
  for (let q = -maxDistance; q <= maxDistance; q += 1) {
    for (let r = -maxDistance; r <= maxDistance; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance > maxDistance) continue;
      const tile = getTileAt(game, { q, r });
      if (tile.claim?.npc?.enemyId) {
        return tile;
      }
    }
  }

  return undefined;
}

function findFactionTownTile(
  game: ReturnType<typeof createGame>,
  maxDistance: number,
) {
  for (let q = -maxDistance; q <= maxDistance; q += 1) {
    for (let r = -maxDistance; r <= maxDistance; r += 1) {
      const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      if (distance > maxDistance) continue;
      const tile = getTileAt(game, { q, r });
      if (tile.claim?.ownerType === 'faction' && tile.structure === 'town') {
        return tile;
      }
    }
  }

  return undefined;
}

function createGeneratedWorldBossEncounter() {
  for (let seedIndex = 0; seedIndex < 32; seedIndex += 1) {
    const game = createGame(20, `generated-footprint-reservation-${seedIndex}`);

    for (let q = -20; q <= 20; q += 1) {
      for (let r = -20; r <= 20; r += 1) {
        const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
        if (distance > 20) continue;
        const coord = { q, r };
        if (
          buildTile(game.seed, coord).enemyIds.some((enemyId) =>
            enemyId.startsWith('world-boss-'),
          )
        ) {
          return { game, center: coord };
        }
      }
    }
  }

  throw new Error('Expected to find a generated world boss encounter');
}

function makeCombatState(
  coord: { q: number; r: number },
  enemyIds: string[],
  worldTimeMs: number,
  started = true,
): GameState['combat'] {
  return {
    coord,
    enemyIds,
    started,
    player: {
      abilityIds: ['kick'],
      globalCooldownMs: 1500,
      globalCooldownEndsAt: worldTimeMs,
      cooldownEndsAt: {},
      casting: null,
    },
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: worldTimeMs,
          cooldownEndsAt: {},
          casting: null,
        },
      ]),
    ),
  };
}
