import { createRng } from './random';
import { GAME_TAGS, uniqueTags } from './content/tags';
import type { AbilityRuntimeDefinition, AbilityId, Enemy, Item } from './types';

export const DEFAULT_ABILITY_ID = 'kick';

const attackAbility = (
  definition: Omit<AbilityRuntimeDefinition, 'category'>,
): AbilityRuntimeDefinition => ({
  ...definition,
  category: 'attacking',
});

const supportAbility = (
  definition: Omit<AbilityRuntimeDefinition, 'category'>,
): AbilityRuntimeDefinition => ({
  ...definition,
  category: 'supportive',
});

export const ABILITY_RUNTIME_DEFINITIONS: Record<
  AbilityId,
  AbilityRuntimeDefinition
> = {
  kick: attackAbility({
    id: 'kick',

    manaCost: 0,
    cooldownMs: 1000,
    castTimeMs: 0,
    target: 'enemy',
    school: 'melee',
    effects: [{ kind: 'damage', powerMultiplier: 1 }],
    aiPriority: -1000,
    tags: uniqueTags(
      GAME_TAGS.ability.combat,
      GAME_TAGS.ability.melee,
      GAME_TAGS.ability.physical,
      GAME_TAGS.ability.instant,
      GAME_TAGS.ability.singleTarget,
    ),
  }),
  slash: attackAbility({
    id: 'slash',

    manaCost: 5,
    cooldownMs: 1800,
    castTimeMs: 0,
    target: 'enemy',
    school: 'melee',
    effects: [
      {
        kind: 'damage',
        powerMultiplier: 1.2,
        statusEffectId: 'bleeding',
        statusChance: 22,
        durationMs: 6_000,
        tickIntervalMs: 1_000,
        valueMultiplier: 0.32,
      },
    ],
    tags: uniqueTags(
      GAME_TAGS.ability.combat,
      GAME_TAGS.ability.melee,
      GAME_TAGS.ability.physical,
      GAME_TAGS.ability.instant,
      GAME_TAGS.ability.singleTarget,
    ),
  }),
  crushingBlow: attackAbility({
    id: 'crushingBlow',

    manaCost: 6,
    cooldownMs: 4500,
    castTimeMs: 300,
    target: 'enemy',
    school: 'melee',
    effects: [
      { kind: 'damage', powerMultiplier: 1.8, flatPower: 2 },
      {
        kind: 'applyStatus',
        statusEffectId: 'weakened',
        value: 18,
        durationMs: 6_000,
      },
    ],
    tags: uniqueTags(
      GAME_TAGS.ability.combat,
      GAME_TAGS.ability.melee,
      GAME_TAGS.ability.physical,
      GAME_TAGS.ability.singleTarget,
    ),
  }),
  hamstring: attackAbility({
    id: 'hamstring',

    manaCost: 5,
    cooldownMs: 3600,
    castTimeMs: 0,
    target: 'enemy',
    school: 'melee',
    effects: [
      { kind: 'damage', powerMultiplier: 1.1 },
      {
        kind: 'applyStatus',
        statusEffectId: 'chilling',
        value: 30,
        durationMs: 5_000,
      },
    ],
    tags: uniqueTags(
      GAME_TAGS.ability.combat,
      GAME_TAGS.ability.melee,
      GAME_TAGS.ability.physical,
      GAME_TAGS.ability.singleTarget,
    ),
  }),
  whirlwind: attackAbility({
    id: 'whirlwind',

    manaCost: 6,
    cooldownMs: 5200,
    castTimeMs: 350,
    target: 'allEnemies',
    school: 'melee',
    effects: [{ kind: 'damage', powerMultiplier: 0.85 }],
    tags: uniqueTags(
      GAME_TAGS.ability.combat,
      GAME_TAGS.ability.melee,
      GAME_TAGS.ability.physical,
    ),
  }),
  impale: attackAbility({
    id: 'impale',

    manaCost: 6,
    cooldownMs: 4800,
    castTimeMs: 250,
    target: 'enemy',
    school: 'melee',
    effects: [
      { kind: 'damage', powerMultiplier: 1.65 },
      {
        kind: 'applyStatus',
        statusEffectId: 'bleeding',
        value: 2,
        durationMs: 8_000,
        tickIntervalMs: 1_000,
      },
    ],
    tags: uniqueTags(
      GAME_TAGS.ability.combat,
      GAME_TAGS.ability.melee,
      GAME_TAGS.ability.physical,
      GAME_TAGS.ability.singleTarget,
    ),
  }),
  emberShot: attackAbility({
    id: 'emberShot',

    manaCost: 5,
    cooldownMs: 2200,
    castTimeMs: 0,
    target: 'enemy',
    school: 'fire',
    effects: [
      { kind: 'damage', powerMultiplier: 1.15 },
      {
        kind: 'damage',
        powerMultiplier: 0,
        statusEffectId: 'burning',
        statusChance: 28,
        durationMs: 6_000,
        tickIntervalMs: 1_000,
        stacks: 1,
        valueMultiplier: 0.22,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  fireball: attackAbility({
    id: 'fireball',

    manaCost: 6,
    cooldownMs: 4300,
    castTimeMs: 500,
    target: 'enemy',
    school: 'fire',
    effects: [
      { kind: 'damage', powerMultiplier: 1.7, flatPower: 1 },
      {
        kind: 'applyStatus',
        statusEffectId: 'burning',
        value: 2,
        durationMs: 6_000,
        tickIntervalMs: 1_000,
        stacks: 1,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  searingNova: attackAbility({
    id: 'searingNova',

    manaCost: 5,
    cooldownMs: 5600,
    castTimeMs: 450,
    target: 'allEnemies',
    school: 'fire',
    effects: [
      { kind: 'damage', powerMultiplier: 0.8 },
      {
        kind: 'applyStatus',
        statusEffectId: 'burning',
        value: 1,
        durationMs: 5_000,
        tickIntervalMs: 1_000,
        stacks: 1,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  cinderBurst: attackAbility({
    id: 'cinderBurst',

    manaCost: 5,
    cooldownMs: 3400,
    castTimeMs: 0,
    target: 'randomEnemy',
    school: 'fire',
    effects: [{ kind: 'damage', powerMultiplier: 1.4 }],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  magmaStrike: attackAbility({
    id: 'magmaStrike',

    manaCost: 5,
    cooldownMs: 6400,
    castTimeMs: 650,
    target: 'enemy',
    school: 'fire',
    effects: [
      { kind: 'damage', powerMultiplier: 2.05, flatPower: 2 },
      {
        kind: 'applyStatus',
        statusEffectId: 'burning',
        value: 3,
        durationMs: 7_000,
        tickIntervalMs: 1_000,
        stacks: 1,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  wildfire: attackAbility({
    id: 'wildfire',

    manaCost: 6,
    cooldownMs: 7200,
    castTimeMs: 700,
    target: 'allEnemies',
    school: 'fire',
    effects: [
      { kind: 'damage', powerMultiplier: 0.9 },
      {
        kind: 'applyStatus',
        statusEffectId: 'burning',
        value: 2,
        durationMs: 7_000,
        tickIntervalMs: 1_000,
        stacks: 1,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  sparkJolt: attackAbility({
    id: 'sparkJolt',

    manaCost: 5,
    cooldownMs: 2400,
    castTimeMs: 0,
    target: 'enemy',
    school: 'lightning',
    effects: [
      { kind: 'damage', powerMultiplier: 1.12 },
      {
        kind: 'applyStatus',
        statusEffectId: 'shocked',
        value: 12,
        durationMs: 5_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  arcBolt: attackAbility({
    id: 'arcBolt',

    manaCost: 5,
    cooldownMs: 3200,
    castTimeMs: 200,
    target: 'randomEnemy',
    school: 'lightning',
    effects: [
      { kind: 'damage', powerMultiplier: 1.35 },
      {
        kind: 'applyStatus',
        statusEffectId: 'shocked',
        value: 15,
        durationMs: 6_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  thunderClap: attackAbility({
    id: 'thunderClap',

    manaCost: 5,
    cooldownMs: 5200,
    castTimeMs: 350,
    target: 'allEnemies',
    school: 'lightning',
    effects: [
      { kind: 'damage', powerMultiplier: 0.78 },
      {
        kind: 'applyStatus',
        statusEffectId: 'shocked',
        value: 18,
        durationMs: 5_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  chainLightning: attackAbility({
    id: 'chainLightning',

    manaCost: 5,
    cooldownMs: 6000,
    castTimeMs: 450,
    target: 'allEnemies',
    school: 'lightning',
    effects: [{ kind: 'damage', powerMultiplier: 0.95 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  stormSurge: attackAbility({
    id: 'stormSurge',

    manaCost: 6,
    cooldownMs: 7600,
    castTimeMs: 700,
    target: 'allEnemies',
    school: 'lightning',
    effects: [
      { kind: 'damage', powerMultiplier: 1.08 },
      {
        kind: 'applyStatus',
        statusEffectId: 'shocked',
        value: 20,
        durationMs: 6_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  staticField: attackAbility({
    id: 'staticField',

    manaCost: 6,
    cooldownMs: 4800,
    castTimeMs: 250,
    target: 'allEnemies',
    school: 'lightning',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'shocked',
        value: 16,
        durationMs: 8_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  frostShard: attackAbility({
    id: 'frostShard',

    manaCost: 5,
    cooldownMs: 2100,
    castTimeMs: 0,
    target: 'enemy',
    school: 'ice',
    effects: [
      { kind: 'damage', powerMultiplier: 1.08 },
      {
        kind: 'applyStatus',
        statusEffectId: 'chilling',
        value: 20,
        durationMs: 5_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  iceLance: attackAbility({
    id: 'iceLance',

    manaCost: 6,
    cooldownMs: 3600,
    castTimeMs: 250,
    target: 'enemy',
    school: 'ice',
    effects: [
      { kind: 'damage', powerMultiplier: 1.55 },
      {
        kind: 'applyStatus',
        statusEffectId: 'chilling',
        value: 28,
        durationMs: 6_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  freezingWave: attackAbility({
    id: 'freezingWave',

    manaCost: 6,
    cooldownMs: 4700,
    castTimeMs: 350,
    target: 'allEnemies',
    school: 'ice',
    effects: [
      { kind: 'damage', powerMultiplier: 0.82 },
      {
        kind: 'applyStatus',
        statusEffectId: 'chilling',
        value: 24,
        durationMs: 6_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  coldSnap: attackAbility({
    id: 'coldSnap',

    manaCost: 5,
    cooldownMs: 3000,
    castTimeMs: 0,
    target: 'randomEnemy',
    school: 'ice',
    effects: [
      { kind: 'damage', powerMultiplier: 1.25 },
      {
        kind: 'applyStatus',
        statusEffectId: 'weakened',
        value: 12,
        durationMs: 5_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  blizzard: attackAbility({
    id: 'blizzard',

    manaCost: 6,
    cooldownMs: 7100,
    castTimeMs: 700,
    target: 'allEnemies',
    school: 'ice',
    effects: [
      { kind: 'damage', powerMultiplier: 0.9 },
      {
        kind: 'applyStatus',
        statusEffectId: 'chilling',
        value: 30,
        durationMs: 7_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  brainFreeze: attackAbility({
    id: 'brainFreeze',

    manaCost: 6,
    cooldownMs: 5400,
    castTimeMs: 400,
    target: 'enemy',
    school: 'ice',
    effects: [
      { kind: 'damage', powerMultiplier: 1.4 },
      {
        kind: 'applyStatus',
        statusEffectId: 'chilling',
        value: 35,
        durationMs: 8_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  mendWounds: supportAbility({
    id: 'mendWounds',

    manaCost: 5,
    cooldownMs: 3200,
    castTimeMs: 350,
    target: 'self',
    school: 'support',
    effects: [{ kind: 'heal', powerMultiplier: 1.2, flatPower: 2 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  fieldDressing: supportAbility({
    id: 'fieldDressing',

    manaCost: 6,
    cooldownMs: 4200,
    castTimeMs: 450,
    target: 'injuredAlly',
    school: 'support',
    effects: [{ kind: 'heal', powerMultiplier: 1.45, flatPower: 3 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  soothingMist: supportAbility({
    id: 'soothingMist',

    manaCost: 5,
    cooldownMs: 6200,
    castTimeMs: 700,
    target: 'allAllies',
    school: 'support',
    effects: [{ kind: 'heal', powerMultiplier: 1.2, splitDivisor: 3 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  rallyingCry: supportAbility({
    id: 'rallyingCry',

    manaCost: 5,
    cooldownMs: 4800,
    castTimeMs: 250,
    target: 'self',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'power',
        value: 14,
        permanent: true,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  battlePrayer: supportAbility({
    id: 'battlePrayer',

    manaCost: 6,
    cooldownMs: 5200,
    castTimeMs: 500,
    target: 'randomAlly',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'restoration',
        value: 2,
        durationMs: 8_000,
        tickIntervalMs: 1_000,
      },
      {
        kind: 'applyStatus',
        statusEffectId: 'frenzy',
        value: 16,
        durationMs: 8_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  warBanner: supportAbility({
    id: 'warBanner',

    manaCost: 5,
    cooldownMs: 6800,
    castTimeMs: 550,
    target: 'allAllies',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'power',
        value: 10,
        permanent: true,
      },
      {
        kind: 'applyStatus',
        statusEffectId: 'guard',
        value: 10,
        permanent: true,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  ironGuard: supportAbility({
    id: 'ironGuard',

    manaCost: 5,
    cooldownMs: 4300,
    castTimeMs: 200,
    target: 'self',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'guard',
        value: 28,
        durationMs: 4_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  arcWard: supportAbility({
    id: 'arcWard',

    manaCost: 6,
    cooldownMs: 5000,
    castTimeMs: 300,
    target: 'randomAlly',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'guard',
        value: 22,
        durationMs: 6_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  witheringHex: supportAbility({
    id: 'witheringHex',

    manaCost: 5,
    cooldownMs: 4700,
    castTimeMs: 350,
    target: 'randomEnemy',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'weakened',
        value: 16,
        permanent: true,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  sunderArmor: supportAbility({
    id: 'sunderArmor',

    manaCost: 5,
    cooldownMs: 3900,
    castTimeMs: 150,
    target: 'enemy',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'shocked',
        value: 26,
        durationMs: 4_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  enfeeblingPulse: supportAbility({
    id: 'enfeeblingPulse',

    manaCost: 6,
    cooldownMs: 7100,
    castTimeMs: 650,
    target: 'allEnemies',
    school: 'support',
    effects: [
      {
        kind: 'applyStatus',
        statusEffectId: 'weakened',
        value: 14,
        durationMs: 7_000,
      },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
};

const BEAST_ABILITY_POOL: AbilityId[] = [
  'slash',
  'hamstring',
  'whirlwind',
  'frostShard',
  'coldSnap',
  'ironGuard',
];

const HUMANOID_ABILITY_POOL: AbilityId[] = [
  'slash',
  'crushingBlow',
  'impale',
  'emberShot',
  'sparkJolt',
  'arcBolt',
  'rallyingCry',
  'battlePrayer',
  'sunderArmor',
];

const ABERRATION_ABILITY_POOL: AbilityId[] = [
  'fireball',
  'searingNova',
  'wildfire',
  'chainLightning',
  'stormSurge',
  'freezingWave',
  'blizzard',
  'mendWounds',
  'soothingMist',
  'warBanner',
  'enfeeblingPulse',
];

export function getAbilityDefinition(abilityId: AbilityId) {
  return (
    ABILITY_RUNTIME_DEFINITIONS[abilityId] ??
    ABILITY_RUNTIME_DEFINITIONS[DEFAULT_ABILITY_ID]
  );
}

export function sortAbilityIdsForCombat(abilityIds: AbilityId[]) {
  return [...new Set(abilityIds)].sort((left, right) => {
    const leftDefinition = getAbilityDefinition(left);
    const rightDefinition = getAbilityDefinition(right);
    const leftPriority =
      (leftDefinition.aiPriority ?? 0) +
      leftDefinition.cooldownMs +
      (left === DEFAULT_ABILITY_ID ? -100_000 : 0);
    const rightPriority =
      (rightDefinition.aiPriority ?? 0) +
      rightDefinition.cooldownMs +
      (right === DEFAULT_ABILITY_ID ? -100_000 : 0);

    return rightPriority - leftPriority;
  });
}

export function enemyAbilityCount(enemy: Pick<Enemy, 'rarity' | 'worldBoss'>) {
  if (enemy.worldBoss || enemy.rarity === 'legendary') return 3;
  if (enemy.rarity === 'rare' || enemy.rarity === 'epic') return 2;
  if (enemy.rarity === 'uncommon') return 1;
  return 0;
}

export function buildEnemyAbilityIds(
  enemy: Pick<Enemy, 'id' | 'rarity' | 'worldBoss' | 'tags' | 'enemyTypeId'>,
  seed: string,
) {
  const count = enemyAbilityCount(enemy);
  if (count <= 0) return [DEFAULT_ABILITY_ID];

  const pool = enemy.tags?.includes(GAME_TAGS.enemy.aberration)
    ? [...ABERRATION_ABILITY_POOL, ...HUMANOID_ABILITY_POOL]
    : enemy.tags?.includes(GAME_TAGS.enemy.humanoid)
      ? HUMANOID_ABILITY_POOL
      : enemy.worldBoss
        ? [
            ...ABERRATION_ABILITY_POOL,
            ...HUMANOID_ABILITY_POOL,
            ...BEAST_ABILITY_POOL,
          ]
        : BEAST_ABILITY_POOL;
  const remaining = [...new Set(pool)];
  const rng = createRng(`${seed}:enemy-abilities:${enemy.id}`);
  const selected: AbilityId[] = [];

  while (selected.length < count && remaining.length > 0) {
    const index = Math.floor(rng() * remaining.length);
    const [abilityId] = remaining.splice(index, 1);
    if (abilityId) selected.push(abilityId);
  }

  return sortAbilityIdsForCombat([DEFAULT_ABILITY_ID, ...selected]);
}

export function buildEquippedAbilityIds(items: Array<Item | undefined>) {
  const granted = items.flatMap((item) =>
    item?.grantedAbilityId ? [item.grantedAbilityId] : [],
  );

  return sortAbilityIdsForCombat([DEFAULT_ABILITY_ID, ...granted]);
}
