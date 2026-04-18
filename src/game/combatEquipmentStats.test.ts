import { describe, expect, it } from 'vitest';
import { ABILITIES } from './abilities';
import { createCombatActorState } from './combat';
import { getPlayerStats } from './progression';
import { createGame, startCombat } from './state';
import type { CombatState, Item, SecondaryStatKey } from './types';

function makeEquipmentItem(
  slot: NonNullable<Item['slot']>,
  overrides: Partial<Item> = {},
): Item {
  return {
    id: `${slot}-test-item`,
    name: `${slot} test item`,
    slot,
    quantity: 1,
    tier: 5,
    rarity: 'legendary',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
    ...overrides,
  };
}

function makeStatItem(
  slot: NonNullable<Item['slot']>,
  stats: Array<[SecondaryStatKey, number]>,
  overrides: Partial<Item> = {},
) {
  return makeEquipmentItem(slot, {
    ...overrides,
    secondaryStats: stats.map(([key, value]) => ({ key, value })),
  });
}

function prepareCombat(options?: {
  playerEquipment?: Item[];
  playerHp?: number;
  playerAbilityIds?: string[];
  playerReady?: boolean;
  enemyAbilityIds?: string[];
  enemyReady?: boolean;
  enemyHp?: number;
  enemyAttack?: number;
  enemyDefense?: number;
}) {
  const game = createGame(3, 'combat-equipment-stats');
  const enemyId = 'enemy-2,0-0';
  const coord = { q: 2, r: 0 };

  game.player.coord = { q: 1, r: 0 };
  game.worldTimeMs = 0;
  for (const item of options?.playerEquipment ?? []) {
    game.player.equipment[item.slot!] = item;
  }
  game.player.hp = options?.playerHp ?? getPlayerStats(game.player).maxHp;
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
    hp: options?.enemyHp ?? 200,
    maxHp: options?.enemyHp ?? 200,
    attack: options?.enemyAttack ?? 0,
    defense: options?.enemyDefense ?? 0,
    xp: 1,
    elite: false,
    statusEffects: [],
    abilityIds: options?.enemyAbilityIds ?? ['kick'],
  };

  const playerActor = createCombatActorState(0, options?.playerAbilityIds ?? ['kick']);
  const enemyActor = createCombatActorState(0, options?.enemyAbilityIds ?? ['kick']);

  if (options?.playerReady === false) {
    playerActor.globalCooldownEndsAt = 999_999;
    playerActor.cooldownEndsAt = Object.fromEntries(
      playerActor.abilityIds.map((abilityId) => [abilityId, 999_999]),
    );
  }
  if (options?.enemyReady === false) {
    enemyActor.globalCooldownEndsAt = 999_999;
    enemyActor.cooldownEndsAt = Object.fromEntries(
      enemyActor.abilityIds.map((abilityId) => [abilityId, 999_999]),
    );
  }

  const combat: CombatState = {
    coord,
    enemyIds: [enemyId],
    started: false,
    player: playerActor,
    enemies: { [enemyId]: enemyActor },
  };
  game.combat = combat;

  return { game, enemyId };
}

describe('combat equipment stats', () => {
  it('respects offensive gear stats during battle', () => {
    const { game, enemyId } = prepareCombat({
      playerEquipment: [
        makeEquipmentItem('weapon', { power: 6, maxHp: 20 }),
        makeStatItem('offhand', [
          ['attackSpeed', 100],
          ['criticalStrikeChance', 100],
          ['criticalStrikeDamage', 100],
          ['lifestealChance', 100],
          ['lifestealAmount', 40],
          ['bleedChance', 100],
          ['poisonChance', 100],
          ['burningChance', 100],
          ['chillingChance', 100],
          ['powerBuffChance', 100],
          ['frenzyBuffChance', 100],
        ]),
      ],
      playerHp: 35,
      enemyReady: false,
      enemyDefense: 0,
      enemyHp: 200,
    });

    const afterStart = startCombat(game);
    const enemy = afterStart.enemies[enemyId]!;

    expect(afterStart.combat?.player.effectiveGlobalCooldownMs).toBe(750);
    expect(afterStart.combat?.player.effectiveCooldownMs?.kick).toBe(500);
    expect(enemy.hp).toBe(175);
    expect(afterStart.player.hp).toBe(50);
    expect(afterStart.player.statusEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'power' }),
        expect.objectContaining({ id: 'frenzy' }),
      ]),
    );
    expect(enemy.statusEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'bleeding' }),
        expect.objectContaining({ id: 'poison' }),
        expect.objectContaining({ id: 'burning' }),
        expect.objectContaining({ id: 'chilling' }),
      ]),
    );
  });

  it('respects defensive gear stats during battle', () => {
    const baseline = startCombat(
      prepareCombat({
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 20,
      }).game,
    );
    const defended = startCombat(
      prepareCombat({
        playerEquipment: [makeEquipmentItem('offhand', { defense: 5 })],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 20,
      }).game,
    );
    const dodged = startCombat(
      prepareCombat({
        playerEquipment: [makeStatItem('offhand', [['dodgeChance', 100]])],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 20,
      }).game,
    );
    const blocked = startCombat(
      prepareCombat({
        playerEquipment: [makeStatItem('offhand', [['blockChance', 100]])],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 20,
      }).game,
    );
    const suppressed = startCombat(
      prepareCombat({
        playerEquipment: [
          makeStatItem('offhand', [
            ['suppressDamageChance', 100],
            ['suppressDamageReduction', 25],
          ]),
        ],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 20,
      }).game,
    );

    expect(baseline.player.hp).toBe(11);
    expect(defended.player.hp).toBe(16);
    expect(dodged.player.hp).toBe(30);
    expect(blocked.player.hp).toBe(30);
    expect(suppressed.player.hp).toBe(25);
  });

  it('respects suppress-debuff gear stats against hostile abilities', () => {
    const guardedAgainstDirect = startCombat(
      prepareCombat({
        playerEquipment: [makeStatItem('offhand', [['suppressDebuffChance', 100]])],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAbilityIds: ['hamstring'],
        enemyAttack: 12,
      }).game,
    );

    expect(
      guardedAgainstDirect.player.statusEffects.some(
        (effect) => effect.id === 'chilling',
      ),
    ).toBe(false);

    const slashDamageEffect = ABILITIES.slash.effects[0];
    const originalStatusChance =
      slashDamageEffect?.kind === 'damage' ? slashDamageEffect.statusChance : undefined;

    if (slashDamageEffect?.kind === 'damage') {
      slashDamageEffect.statusChance = 100;
    }

    try {
      const guardedAgainstConfigured = startCombat(
        prepareCombat({
          playerEquipment: [makeStatItem('offhand', [['suppressDebuffChance', 100]])],
          playerAbilityIds: ['kick'],
          playerReady: false,
          enemyAbilityIds: ['slash'],
          enemyAttack: 12,
        }).game,
      );

      expect(
        guardedAgainstConfigured.player.statusEffects.some(
          (effect) => effect.id === 'bleeding',
        ),
      ).toBe(false);
    } finally {
      if (slashDamageEffect?.kind === 'damage') {
        slashDamageEffect.statusChance = originalStatusChance;
      }
    }
  });

  it('spends enemy mana when casting a paid ability', () => {
    const { game, enemyId } = prepareCombat({
      playerAbilityIds: ['kick'],
      playerReady: false,
      enemyAbilityIds: ['slash', 'kick'],
      enemyAttack: 12,
    });
    game.enemies[enemyId]!.mana = 5;
    game.enemies[enemyId]!.maxMana = 100;

    const afterFirstCast = startCombat(game);

    expect(afterFirstCast.enemies[enemyId]?.mana).toBe(0);
  });
});
