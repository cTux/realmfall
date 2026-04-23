import { GAME_TAGS, uniqueTags } from './content/tags';
import type { AbilityRuntimeDefinition } from './types';
import { attackAbility } from './abilityCatalogShared';

export const MELEE_ABILITY_DEFINITIONS = {
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
} satisfies Record<string, AbilityRuntimeDefinition>;
