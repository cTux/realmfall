import { GAME_TAGS, uniqueTags } from './content/tags';
import type { AbilityRuntimeDefinition } from './types';
import { attackAbility } from './abilityCatalogShared';

export const LIGHTNING_ABILITY_DEFINITIONS = {
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
} satisfies Record<string, AbilityRuntimeDefinition>;
