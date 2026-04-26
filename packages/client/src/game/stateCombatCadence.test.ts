import { createGame, progressCombat, startCombat, moveToTile } from './state';
import { createCombatActorState } from './combat';
import {
  createCombatEncounterGame,
  seedCombatEncounter,
} from './stateCombatTestHelpers';

describe('game state combat cadence', () => {
  it('respects global cooldown and ability cooldown between player casts', () => {
    const game = createCombatEncounterGame('kick-cooldown-seed');
    const target = seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Training Dummy',
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    });

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
    const game = createCombatEncounterGame('thirst-cooldown-seed');
    const target = seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Training Dummy',
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 0,
      defense: 0,
      xp: 0,
      elite: false,
    });
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
    const game = createCombatEncounterGame('enemy-kick-seed');
    const target = seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 40,
      defense: 0,
      xp: 1,
      elite: false,
    });

    const encountered = moveToTile(game, target);
    const started = startCombat(encountered);
    const firstTick = progressCombat(started);

    expect(started.player.hp).toBeLessThan(started.player.baseMaxHp);
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
});
