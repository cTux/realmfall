import {
  createGame,
  forfeitCombat,
  getEnemiesAt,
  getPlayerStats,
  getTileAt,
  moveToTile,
  progressCombat,
  startCombat,
  syncPlayerStatusEffects,
} from './state';
import { createCombatActorState } from './combat';
import { Skill } from './types';

describe('game state combat flow', () => {
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

  it('lets the player forfeit a battle after combat has started', () => {
    const game = createGame(3, 'combat-forfeit-seed');
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
      attack: 2,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };
    game.homeHex = { q: 0, r: 0 };
    game.worldTimeMs = 75_000;

    const encountered = moveToTile(game, target);
    const started = startCombat(encountered);

    expect(started.combat?.startedAtMs).toBe(75_000);

    const forfeited = forfeitCombat(started);

    expect(forfeited.combat).toBeNull();
    expect(forfeited.player.coord).toEqual({ q: 0, r: 0 });
    expect(forfeited.player.hp).toBe(1);
    expect(
      forfeited.logs.some((entry) => /you were defeated/i.test(entry.text)),
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
        /you .*hit the/i.test(entry.text),
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
        /the wolf .*hits you/i.test(entry.text),
      ),
    ).toHaveLength(2);
    expect(resolvedRound.player.hp).toBeLessThan(
      getPlayerStats(resolvedRound.player).maxHp,
    );
  });
});
