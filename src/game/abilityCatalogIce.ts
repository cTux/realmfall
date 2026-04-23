import { GAME_TAGS, uniqueTags } from './content/tags';
import type { AbilityRuntimeDefinition } from './types';
import { attackAbility } from './abilityCatalogShared';

export const ICE_ABILITY_DEFINITIONS = {
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
} satisfies Record<string, AbilityRuntimeDefinition>;
