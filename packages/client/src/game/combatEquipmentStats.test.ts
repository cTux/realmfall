import { describe, expect, it } from 'vitest';
import { ABILITIES } from './abilities';
import { createCombatActorState } from './combat';
import { getPlayerOverview } from './progression';
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
  seed?: string;
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
  const game = createGame(3, options?.seed ?? 'combat-equipment-stats');
  const enemyId = 'enemy-2,0-0';
  const coord = { q: 2, r: 0 };

  game.player.coord = { q: 1, r: 0 };
  game.worldTimeMs = 0;
  for (const item of options?.playerEquipment ?? []) {
    game.player.equipment[item.slot!] = item;
  }
  game.player.hp = options?.playerHp ?? getPlayerOverview(game.player).maxHp;
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

  const playerActor = createCombatActorState(
    0,
    options?.playerAbilityIds ?? ['kick'],
  );
  const enemyActor = createCombatActorState(
    0,
    options?.enemyAbilityIds ?? ['kick'],
  );

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

function findCombatResult(
  predicate: (result: ReturnType<typeof startCombat>) => boolean,
  options: Parameters<typeof prepareCombat>[0],
) {
  for (let index = 0; index < 400; index += 1) {
    const result = startCombat(
      prepareCombat({
        ...options,
        seed: `combat-equipment-stats-${index}`,
      }).game,
    );

    if (predicate(result)) {
      return result;
    }
  }

  throw new Error('Expected a matching combat result.');
}

describe('combat equipment stats', () => {
  it('respects offensive gear stats during battle', () => {
    const baseline = startCombat(
      prepareCombat({
        playerHp: 35,
        enemyReady: false,
        enemyDefense: 0,
        enemyHp: 200,
      }).game,
    );
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

    expect(afterStart.combat?.player.effectiveGlobalCooldownMs).toBe(1143);
    expect(afterStart.combat?.player.effectiveCooldownMs?.kick).toBe(571);
    expect(baseline.combat?.player.effectiveGlobalCooldownMs ?? Infinity).toBe(
      2000,
    );
    expect(baseline.combat?.player.effectiveCooldownMs?.kick ?? Infinity).toBe(
      1000,
    );
    expect(enemy.hp).toBeLessThan(baseline.enemies[enemyId]!.hp);
    expect(afterStart.player.hp).toBeGreaterThan(35);
    expect(afterStart.player.hp).toBeLessThanOrEqual(
      getPlayerOverview(afterStart.player).maxHp,
    );
  });

  it('treats +100% attack speed as a 2x speed modifier instead of instant cooldowns', () => {
    const { game } = prepareCombat({
      enemyReady: false,
      enemyDefense: 0,
      enemyHp: 200,
    });
    game.player.statusEffects = [
      {
        id: 'frenzy',
        value: 100,
      },
    ];

    const afterStart = startCombat(game);

    expect(afterStart.combat?.player.effectiveGlobalCooldownMs).toBe(1000);
    expect(afterStart.combat?.player.effectiveCooldownMs?.kick).toBe(500);
  });

  it('does not add phantom direct damage for status-only damage effects', () => {
    const { game, enemyId } = prepareCombat({
      playerAbilityIds: ['emberShot'],
      enemyReady: false,
      enemyDefense: 0,
      enemyHp: 100,
    });

    const afterStart = startCombat(game);

    expect(afterStart.enemies[enemyId]?.hp).toBe(43);
  });

  it('starts the player at the baseline critical strike chance', () => {
    const { game } = prepareCombat({
      playerReady: false,
      enemyReady: false,
    });

    expect(getPlayerOverview(game.player).criticalStrikeChance).toBe(5);
  });

  it('starts the player at the baseline dodge and suppress-damage chances', () => {
    const { game } = prepareCombat({
      playerReady: false,
      enemyReady: false,
    });

    expect(getPlayerOverview(game.player).dodgeChance).toBe(5);
    expect(getPlayerOverview(game.player).suppressDamageChance).toBe(5);
  });

  it('respects defensive gear stats during battle', () => {
    const baseline = startCombat(
      prepareCombat({
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 60,
      }).game,
    );
    const defended = startCombat(
      prepareCombat({
        playerEquipment: [makeEquipmentItem('offhand', { defense: 5 })],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 60,
      }).game,
    );
    const dodged = findCombatResult(
      (result) => result.logs.some((entry) => /evade/i.test(entry.text)),
      {
        playerEquipment: [makeStatItem('offhand', [['dodgeChance', 100]])],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 60,
      },
    );
    const blocked = findCombatResult(
      (result) => result.logs.some((entry) => /blocked/i.test(entry.text)),
      {
        playerEquipment: [makeStatItem('offhand', [['blockChance', 100]])],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 60,
      },
    );
    const suppressed = findCombatResult(
      (result) =>
        result.logs.some((entry) => /suppressed damage from/i.test(entry.text)),
      {
        playerEquipment: [
          makeStatItem('offhand', [
            ['suppressDamageChance', 100],
            ['suppressDamageReduction', 25],
          ]),
        ],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 60,
      },
    );

    expect(defended.player.hp).toBeGreaterThan(baseline.player.hp);
    expect(dodged.player.hp).toBeGreaterThanOrEqual(baseline.player.hp);
    expect(blocked.player.hp).toBeGreaterThanOrEqual(baseline.player.hp);
    expect(suppressed.player.hp).toBeGreaterThan(baseline.player.hp);
    expect(dodged.logs.some((entry) => /evade/i.test(entry.text))).toBe(true);
    expect(blocked.logs.some((entry) => /blocked/i.test(entry.text))).toBe(
      true,
    );
    expect(
      suppressed.logs.some((entry) =>
        /suppressed damage from/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('logs defended-against enemy hits instead of 0 damage', () => {
    const absorbed = startCombat(
      prepareCombat({
        playerEquipment: [makeEquipmentItem('offhand', { defense: 40 })],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAttack: 60,
      }).game,
    );

    expect(absorbed.player.hp).toBe(getPlayerOverview(absorbed.player).maxHp);
    expect(
      absorbed.logs.some((entry) => /defended against/i.test(entry.text)),
    ).toBe(true);
    expect(absorbed.logs.some((entry) => /for 0\b/i.test(entry.text))).toBe(
      false,
    );
  });

  it('logs critical hits and lifesteal healing with combat sources', () => {
    const resolved = startCombat(
      prepareCombat({
        playerEquipment: [
          makeStatItem('offhand', [
            ['criticalStrikeChance', 100],
            ['criticalStrikeDamage', 100],
            ['lifestealChance', 100],
            ['lifestealAmount', 10],
          ]),
        ],
        playerHp: 20,
        enemyReady: false,
        enemyDefense: 0,
        enemyHp: 200,
      }).game,
    );

    const criticalHitLog = resolved.logs.find((entry) =>
      /critically hit/i.test(entry.text),
    );
    const lifestealLog = resolved.logs.find((entry) =>
      /healed for/i.test(entry.text),
    );

    expect(
      criticalHitLog?.richText?.some((segment) => segment.kind === 'entity'),
    ).toBe(true);
    expect(
      criticalHitLog?.richText?.some(
        (segment) =>
          segment.kind === 'source' &&
          segment.source.kind === 'ability' &&
          segment.source.abilityId === 'kick',
      ),
    ).toBe(true);
    expect(
      lifestealLog?.richText?.some(
        (segment) =>
          segment.kind === 'source' &&
          segment.source.kind === 'secondaryStat' &&
          segment.source.stat === 'lifestealAmount',
      ),
    ).toBe(true);
  });

  it('respects suppress-debuff gear stats against hostile abilities', () => {
    const guardedAgainstDirect = findCombatResult(
      (result) =>
        result.logs.some((entry) => /shrug off chilling/i.test(entry.text)),
      {
        playerEquipment: [
          makeStatItem('offhand', [['suppressDebuffChance', 100]]),
        ],
        playerAbilityIds: ['kick'],
        playerReady: false,
        enemyAbilityIds: ['hamstring'],
        enemyAttack: 60,
      },
    );

    expect(
      guardedAgainstDirect.player.statusEffects.some(
        (effect) => effect.id === 'chilling',
      ),
    ).toBe(false);
    expect(
      guardedAgainstDirect.logs.some((entry) =>
        /shrug off chilling/i.test(entry.text),
      ),
    ).toBe(true);

    const slashDamageEffect = ABILITIES.slash.effects[0];
    const originalStatusChance =
      slashDamageEffect?.kind === 'damage'
        ? slashDamageEffect.statusChance
        : undefined;

    if (slashDamageEffect?.kind === 'damage') {
      slashDamageEffect.statusChance = 100;
    }

    try {
      const guardedAgainstConfigured = findCombatResult(
        (result) =>
          result.logs.some((entry) => /shrug off bleeding/i.test(entry.text)),
        {
          playerEquipment: [
            makeStatItem('offhand', [['suppressDebuffChance', 100]]),
          ],
          playerAbilityIds: ['kick'],
          playerReady: false,
          enemyAbilityIds: ['slash'],
          enemyAttack: 60,
        },
      );

      expect(
        guardedAgainstConfigured.player.statusEffects.some(
          (effect) => effect.id === 'bleeding',
        ),
      ).toBe(false);
      expect(
        guardedAgainstConfigured.logs.some((entry) =>
          /shrug off bleeding/i.test(entry.text),
        ),
      ).toBe(true);
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
