import { describe, expect, it } from 'vitest';
import { createCombatActorState } from './combat';
import { StatusEffectTypeId } from './content/ids';
import { createGame, getCombatAutomationDelay } from './state';

function prepareCombatAutomationState() {
  const game = createGame(3, 'combat-automation');
  const enemyId = 'enemy-2,0-0';
  const coord = { q: 2, r: 0 };

  game.player.coord = { q: 1, r: 0 };
  game.tiles['2,0'] = {
    coord,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [enemyId],
  };
  game.enemies[enemyId] = {
    id: enemyId,
    name: 'Training Dummy',
    coord,
    tier: 1,
    hp: 200,
    maxHp: 200,
    attack: 0,
    defense: 0,
    xp: 0,
    elite: false,
    statusEffects: [],
    abilityIds: ['kick'],
  };

  const playerActor = createCombatActorState(0, ['kick']);
  const enemyActor = createCombatActorState(0, ['kick']);
  setActorReadyAt(playerActor, 7_000);
  setActorReadyAt(enemyActor, 7_000);

  game.combat = {
    coord,
    enemyIds: [enemyId],
    started: true,
    player: playerActor,
    enemies: {
      [enemyId]: enemyActor,
    },
  };

  return { game, enemyId };
}

function setActorReadyAt(
  actor: ReturnType<typeof createCombatActorState>,
  readyAt: number,
) {
  actor.globalCooldownEndsAt = readyAt;
  actor.cooldownEndsAt = Object.fromEntries(
    actor.abilityIds.map((abilityId) => [abilityId, readyAt]),
  );
}

describe('combat automation timing', () => {
  it('skips earlier cooldowns for enemy abilities that cannot act yet', () => {
    const { game, enemyId } = prepareCombatAutomationState();
    const enemyActor = game.combat!.enemies[enemyId]!;
    enemyActor.abilityIds = ['fieldDressing', 'kick'];
    enemyActor.cooldownEndsAt = {
      fieldDressing: 1_000,
      kick: 2_000,
    };
    enemyActor.globalCooldownEndsAt = 0;

    expect(getCombatAutomationDelay(game, 0)).toBe(2_000);
  });

  it('wakes for the next ticking combat status effect before long ability cooldowns', () => {
    const { game, enemyId } = prepareCombatAutomationState();
    game.enemies[enemyId]!.statusEffects = [
      {
        id: StatusEffectTypeId.Burning,
        value: 8,
        tickIntervalMs: 1_000,
        lastProcessedAt: 0,
        expiresAt: 8_000,
      },
    ];

    expect(getCombatAutomationDelay(game, 0)).toBe(1_000);
  });

  it('wakes for combat status expiry even when no ability is about to fire', () => {
    const { game } = prepareCombatAutomationState();
    game.player.statusEffects = [
      {
        id: StatusEffectTypeId.Chilling,
        lastProcessedAt: 0,
        expiresAt: 1_500,
      },
    ];

    expect(getCombatAutomationDelay(game, 0)).toBe(1_500);
  });

  it('resolves overdue combat status ticks immediately', () => {
    const { game, enemyId } = prepareCombatAutomationState();
    game.enemies[enemyId]!.statusEffects = [
      {
        id: StatusEffectTypeId.Poison,
        tickIntervalMs: 1_000,
        lastProcessedAt: 0,
        expiresAt: 8_000,
      },
    ];

    expect(getCombatAutomationDelay(game, 2_500)).toBe(0);
  });
});
