import {
  createGame,
  dropInventoryItem,
  EQUIPMENT_SLOTS,
  equipItem,
  HARVEST_MOON_RESOURCE_TYPE_CHANCES,
  getEnemyAt,
  getEnemiesAt,
  getPlayerStats,
  getRecipeBookRecipes,
  getSafePathToTile,
  getTileAt,
  getVisibleTiles,
  moveToTile,
  moveAlongSafePath,
  progressCombat,
  startCombat,
  syncBloodMoon,
  syncPlayerStatusEffects,
  takeAllTileItems,
  triggerEarthshake,
  useItem,
  type GameState,
  type Item,
} from './state';
import { hexDistance } from './hex';
import { createCombatActorState, makeEnemy } from './combat';
import {
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
  HOME_SCROLL_ITEM_NAME_KEY,
  WORLD_REVEAL_RADIUS,
} from './config';
import { t } from '../i18n';
import { buildItemFromConfig, getItemCategory } from './content/items';
import { Skill } from './types';
import { createPlacedWorldBossEncounter } from './stateTestHelpers';

describe('game state', () => {
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
      enemyTypeId: 'wolf',
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
      hp: 200,
      maxHp: 200,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const firstCast = startCombat(encountered);
    const secondCastTooEarly = progressCombat(firstCast);

    expect(secondCastTooEarly.enemies['enemy-2,0-0']?.hp).toBe(150);
    expect(
      secondCastTooEarly.logs.filter((entry) =>
        /you kick the/i.test(entry.text),
      ),
    ).toHaveLength(1);

    const afterAbilityCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 1000,
    });

    expect(afterAbilityCooldown.enemies['enemy-2,0-0']?.hp).toBe(150);

    const afterGlobalCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 2000,
    });

    expect(afterGlobalCooldown.enemies['enemy-2,0-0']?.hp).toBe(100);
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
      hp: 200,
      maxHp: 200,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };
    game.player.thirst = 20;

    const encountered = moveToTile(game, target);
    const firstCast = startCombat(encountered);

    expect(firstCast.combat?.player.effectiveGlobalCooldownMs).toBe(2500);
    expect(firstCast.combat?.player.effectiveCooldownMs?.kick).toBe(1250);

    const afterBaseAbilityCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 2000,
    });

    expect(afterBaseAbilityCooldown.enemies['enemy-2,0-0']?.hp).toBe(150);

    const afterScaledCooldown = progressCombat({
      ...firstCast,
      worldTimeMs: 2500,
    });

    expect(afterScaledCooldown.enemies['enemy-2,0-0']?.hp).toBe(100);
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
      hp: 200,
      maxHp: 200,
      attack: 40,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const started = startCombat(encountered);
    const firstTick = progressCombat(started);

    expect(started.player.hp).toBeLessThan(
      getPlayerStats(started.player).maxHp,
    );
    expect(firstTick.player.hp).toBe(started.player.hp);

    const beforeSecondKick = progressCombat({
      ...firstTick,
      worldTimeMs: 1000,
    });
    expect(beforeSecondKick.player.hp).toBe(firstTick.player.hp);

    const afterSecondKick = progressCombat({ ...firstTick, worldTimeMs: 2000 });
    expect(afterSecondKick.player.hp).toBeLessThan(firstTick.player.hp);
    expect(afterSecondKick.combat).not.toBeNull();
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
      hp: 100,
      maxHp: 100,
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
      hp: 100,
      maxHp: 100,
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

  it('keeps player status rich-text target-agnostic for multi-target casts', () => {
    const game = createGame(3, 'multi-target-status-log-seed');
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
      statusEffects: [],
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
      statusEffects: [],
    };
    game.player.mana = 50;
    game.combat = {
      coord: target,
      enemyIds: ['enemy-2,0-0', 'enemy-2,0-1'],
      started: false,
      player: createCombatActorState(0, ['enfeeblingPulse']),
      enemies: {
        'enemy-2,0-0': createCombatActorState(0, ['kick']),
        'enemy-2,0-1': createCombatActorState(0, ['kick']),
      },
    };

    const started = startCombat(game);
    const resolved = progressCombat({ ...started, worldTimeMs: 1000 });
    const statusLog = resolved.logs.find(
      (entry) =>
        entry.kind === 'combat' &&
        entry.richText?.some(
          (segment) =>
            segment.kind === 'source' &&
            segment.source.kind === 'ability' &&
            segment.source.abilityId === 'enfeeblingPulse',
        ) &&
        /weakened/i.test(entry.text),
    );

    expect(
      resolved.enemies['enemy-2,0-0']?.statusEffects?.some(
        (effect) => effect.id === 'weakened',
      ),
    ).toBe(true);
    expect(
      resolved.enemies['enemy-2,0-1']?.statusEffects?.some(
        (effect) => effect.id === 'weakened',
      ),
    ).toBe(true);
    expect(
      statusLog?.richText?.some((segment) => segment.kind === 'entity'),
    ).toBe(false);
    expect(statusLog?.richText).toEqual([
      { kind: 'text', text: 'You apply ' },
      {
        kind: 'source',
        text: 'Weakened',
        source: {
          kind: 'statusEffect',
          effectId: 'weakened',
          tone: undefined,
          value: undefined,
          tickIntervalMs: undefined,
          stacks: undefined,
        },
      },
      { kind: 'text', text: ' with ' },
      {
        kind: 'source',
        text: 'Enfeebling Pulse',
        source: {
          kind: 'ability',
          abilityId: 'enfeeblingPulse',
          attack: undefined,
        },
      },
      { kind: 'text', text: '.' },
    ]);
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
      hp: 200,
      maxHp: 200,
      attack: 60,
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

  it('does not consume consumables when the equip-only path is used', () => {
    const game = createGame(3, 'equip-consumable-seed');

    const attempted = equipItem(game, 'starter-ration');

    expect(
      attempted.player.inventory.find((item) => item.id === 'starter-ration')
        ?.quantity,
    ).toBe(2);
    expect(attempted.logs[0]?.text).toMatch(/cannot be equipped/i);
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

  it('uses health and mana potions for 35 percent of the matching max stat', () => {
    const game = createGame(3, 'use-potions-seed');
    const hpPotion = buildItemFromConfig('health-potion', {
      id: 'health-potion-1',
    });
    const mpPotion = buildItemFromConfig('mana-potion', {
      id: 'mana-potion-1',
    });
    game.player.inventory.push(hpPotion, mpPotion);
    game.player.hp = 25;
    game.player.mana = 3;

    const healed = useItem(game, 'health-potion-1');
    expect(healed.player.hp).toBe(78);
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
    expect(restored.player.mana).toBe(8);
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
      hp: 200,
      maxHp: 200,
      attack: 40,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-2,0-1'] = {
      id: 'enemy-2,0-1',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 41,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolvedRound = startCombat(encountered);

    expect(resolvedRound.combat?.enemyIds).toHaveLength(2);
    expect(
      resolvedRound.logs.filter((entry) =>
        /the wolf kicks you/i.test(entry.text),
      ),
    ).toHaveLength(2);
    expect(resolvedRound.player.hp).toBeLessThan(
      getPlayerStats(resolvedRound.player).maxHp,
    );
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
    expect(stats.maxHp).toBe(189);
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
