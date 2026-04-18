import heartPlusIcon from '../assets/game-icons/zeromancer/heart-plus.svg';
import heartMinusIcon from '../assets/game-icons/zeromancer/heart-minus.svg';
import swordSliceIcon from '../assets/game-icons/lorc/sword-slice.svg';
import swordClashIcon from '../assets/game-icons/lorc/sword-clash.svg';
import thrownSpearIcon from '../assets/game-icons/lorc/thrown-spear.svg';
import smashingArrowsIcon from '../assets/game-icons/lorc/smash-arrows.svg';
import whirlwindIcon from '../assets/game-icons/lorc/whirlwind.svg';
import fireballIcon from '../assets/game-icons/lorc/fireball.svg';
import fireWaveIcon from '../assets/game-icons/lorc/fire-wave.svg';
import fireRingIcon from '../assets/game-icons/lorc/fire-ring.svg';
import fireRayIcon from '../assets/game-icons/lorc/fire-ray.svg';
import threeBurningBallsIcon from '../assets/game-icons/lorc/three-burning-balls.svg';
import wildfiresIcon from '../assets/game-icons/lorc/wildfires.svg';
import chainLightningIcon from '../assets/game-icons/willdabeast/chain-lightning.svg';
import thunderballIcon from '../assets/game-icons/lorc/thunderball.svg';
import thunderStruckIcon from '../assets/game-icons/lorc/thunder-struck.svg';
import lightningStormIcon from '../assets/game-icons/lorc/lightning-storm.svg';
import lightningArcIcon from '../assets/game-icons/lorc/lightning-arc.svg';
import staticWavesIcon from '../assets/game-icons/lorc/static-waves.svg';
import iceBoltIcon from '../assets/game-icons/lorc/ice-bolt.svg';
import iceSpearIcon from '../assets/game-icons/lorc/ice-spear.svg';
import icebergsIcon from '../assets/game-icons/lorc/icebergs.svg';
import personInBlizzardIcon from '../assets/game-icons/lorc/person-in-blizzard.svg';
import snowflakeIcon from '../assets/game-icons/lorc/snowflake-2.svg';
import brainFreezeIcon from '../assets/game-icons/lorc/brain-freeze.svg';
import healingIcon from '../assets/game-icons/delapouite/healing.svg';
import healthPotionIcon from '../assets/game-icons/delapouite/health-potion.svg';
import knightBannerIcon from '../assets/game-icons/delapouite/knight-banner.svg';
import verticalBannerIcon from '../assets/game-icons/delapouite/vertical-banner.svg';
import shieldIcon from '../assets/game-icons/sbed/shield.svg';
import magicShieldIcon from '../assets/game-icons/lorc/magic-shield.svg';
import sparklesIcon from '../assets/game-icons/delapouite/sparkles.svg';
import { t } from '../i18n';
import { formatStatusEffectLabel } from '../i18n/labels';
import { createRng } from './random';
import { GAME_TAGS, uniqueTags } from './content/tags';
import type {
  AbilityDefinition,
  AbilityEffectDefinition,
  AbilityId,
  Enemy,
  Item,
} from './types';

export const DEFAULT_ABILITY_ID = 'kick';

const attackAbility = (
  definition: Omit<AbilityDefinition, 'category' | 'description'>,
): AbilityDefinition => ({
  ...definition,
  category: 'attacking',
  description: buildAbilityDescription(definition),
});

const supportAbility = (
  definition: Omit<AbilityDefinition, 'category' | 'description'>,
): AbilityDefinition => ({
  ...definition,
  category: 'supportive',
  description: buildAbilityDescription(definition),
});

export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  kick: attackAbility({
    id: 'kick',
    name: t('game.ability.kick.name'),
    icon: smashingArrowsIcon,
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
    name: t('game.ability.slash.name'),
    icon: swordSliceIcon,
    manaCost: 0,
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
    name: t('game.ability.crushingBlow.name'),
    icon: swordClashIcon,
    manaCost: 2,
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
    name: t('game.ability.hamstring.name'),
    icon: thrownSpearIcon,
    manaCost: 2,
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
    name: t('game.ability.whirlwind.name'),
    icon: whirlwindIcon,
    manaCost: 4,
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
    name: t('game.ability.impale.name'),
    icon: thrownSpearIcon,
    manaCost: 3,
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
    name: t('game.ability.emberShot.name'),
    icon: fireRayIcon,
    manaCost: 2,
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
    name: t('game.ability.fireball.name'),
    icon: fireballIcon,
    manaCost: 4,
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
    name: t('game.ability.searingNova.name'),
    icon: fireRingIcon,
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
    name: t('game.ability.cinderBurst.name'),
    icon: threeBurningBallsIcon,
    manaCost: 3,
    cooldownMs: 3400,
    castTimeMs: 0,
    target: 'randomEnemy',
    school: 'fire',
    effects: [{ kind: 'damage', powerMultiplier: 1.4 }],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  magmaStrike: attackAbility({
    id: 'magmaStrike',
    name: t('game.ability.magmaStrike.name'),
    icon: fireWaveIcon,
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
    name: t('game.ability.wildfire.name'),
    icon: wildfiresIcon,
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
    name: t('game.ability.sparkJolt.name'),
    icon: lightningArcIcon,
    manaCost: 2,
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
    name: t('game.ability.arcBolt.name'),
    icon: thunderballIcon,
    manaCost: 3,
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
    name: t('game.ability.thunderClap.name'),
    icon: thunderStruckIcon,
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
    name: t('game.ability.chainLightning.name'),
    icon: chainLightningIcon,
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
    name: t('game.ability.stormSurge.name'),
    icon: lightningStormIcon,
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
    name: t('game.ability.staticField.name'),
    icon: staticWavesIcon,
    manaCost: 4,
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
    name: t('game.ability.frostShard.name'),
    icon: iceBoltIcon,
    manaCost: 2,
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
    name: t('game.ability.iceLance.name'),
    icon: iceSpearIcon,
    manaCost: 3,
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
    name: t('game.ability.freezingWave.name'),
    icon: icebergsIcon,
    manaCost: 4,
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
    name: t('game.ability.coldSnap.name'),
    icon: snowflakeIcon,
    manaCost: 3,
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
    name: t('game.ability.blizzard.name'),
    icon: personInBlizzardIcon,
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
    name: t('game.ability.brainFreeze.name'),
    icon: brainFreezeIcon,
    manaCost: 4,
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
    name: t('game.ability.mendWounds.name'),
    icon: heartPlusIcon,
    manaCost: 3,
    cooldownMs: 3200,
    castTimeMs: 350,
    target: 'self',
    school: 'support',
    effects: [{ kind: 'heal', powerMultiplier: 1.2, flatPower: 2 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  fieldDressing: supportAbility({
    id: 'fieldDressing',
    name: t('game.ability.fieldDressing.name'),
    icon: healthPotionIcon,
    manaCost: 4,
    cooldownMs: 4200,
    castTimeMs: 450,
    target: 'injuredAlly',
    school: 'support',
    effects: [{ kind: 'heal', powerMultiplier: 1.45, flatPower: 3 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  soothingMist: supportAbility({
    id: 'soothingMist',
    name: t('game.ability.soothingMist.name'),
    icon: healingIcon,
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
    name: t('game.ability.rallyingCry.name'),
    icon: knightBannerIcon,
    manaCost: 3,
    cooldownMs: 4800,
    castTimeMs: 250,
    target: 'self',
    school: 'support',
    effects: [{ kind: 'applyStatus', statusEffectId: 'power', value: 14, permanent: true }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  battlePrayer: supportAbility({
    id: 'battlePrayer',
    name: t('game.ability.battlePrayer.name'),
    icon: sparklesIcon,
    manaCost: 4,
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
    name: t('game.ability.warBanner.name'),
    icon: verticalBannerIcon,
    manaCost: 5,
    cooldownMs: 6800,
    castTimeMs: 550,
    target: 'allAllies',
    school: 'support',
    effects: [
      { kind: 'applyStatus', statusEffectId: 'power', value: 10, permanent: true },
      { kind: 'applyStatus', statusEffectId: 'guard', value: 10, permanent: true },
    ],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  ironGuard: supportAbility({
    id: 'ironGuard',
    name: t('game.ability.ironGuard.name'),
    icon: shieldIcon,
    manaCost: 3,
    cooldownMs: 4300,
    castTimeMs: 200,
    target: 'self',
    school: 'support',
    effects: [{ kind: 'applyStatus', statusEffectId: 'guard', value: 28, durationMs: 4_000 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  arcWard: supportAbility({
    id: 'arcWard',
    name: t('game.ability.arcWard.name'),
    icon: magicShieldIcon,
    manaCost: 4,
    cooldownMs: 5000,
    castTimeMs: 300,
    target: 'randomAlly',
    school: 'support',
    effects: [{ kind: 'applyStatus', statusEffectId: 'guard', value: 22, durationMs: 6_000 }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  witheringHex: supportAbility({
    id: 'witheringHex',
    name: t('game.ability.witheringHex.name'),
    icon: heartMinusIcon,
    manaCost: 4,
    cooldownMs: 4700,
    castTimeMs: 350,
    target: 'randomEnemy',
    school: 'support',
    effects: [{ kind: 'applyStatus', statusEffectId: 'weakened', value: 16, permanent: true }],
    tags: uniqueTags(GAME_TAGS.ability.combat),
  }),
  sunderArmor: supportAbility({
    id: 'sunderArmor',
    name: t('game.ability.sunderArmor.name'),
    icon: heartMinusIcon,
    manaCost: 3,
    cooldownMs: 3900,
    castTimeMs: 150,
    target: 'enemy',
    school: 'support',
    effects: [{ kind: 'applyStatus', statusEffectId: 'shocked', value: 26, durationMs: 4_000 }],
    tags: uniqueTags(GAME_TAGS.ability.combat, GAME_TAGS.ability.singleTarget),
  }),
  enfeeblingPulse: supportAbility({
    id: 'enfeeblingPulse',
    name: t('game.ability.enfeeblingPulse.name'),
    icon: heartMinusIcon,
    manaCost: 6,
    cooldownMs: 7100,
    castTimeMs: 650,
    target: 'allEnemies',
    school: 'support',
    effects: [{ kind: 'applyStatus', statusEffectId: 'weakened', value: 14, durationMs: 7_000 }],
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
  return ABILITIES[abilityId] ?? ABILITIES[DEFAULT_ABILITY_ID];
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

function buildAbilityDescription(
  ability: Pick<AbilityDefinition, 'target' | 'effects' | 'school'>,
) {
  const parts = [
    t(`ui.ability.description.target.${ability.target}`),
    ...ability.effects.map((effect) =>
      describeAbilityEffect(effect, ability.target, ability.school),
    ),
  ].filter(Boolean);

  return parts.join(' ');
}

function describeAbilityEffect(
  effect: AbilityEffectDefinition,
  defaultTarget: AbilityDefinition['target'],
  school: AbilityDefinition['school'],
) {
  const target = effect.targetOverride ?? defaultTarget;
  const enemyTarget =
    target === 'enemy' || target === 'randomEnemy' || target === 'allEnemies';

  if (effect.kind === 'damage') {
    const hasDirectDamage =
      effect.powerMultiplier !== 0 || (effect.flatPower ?? 0) !== 0;
    const statusEffect = effect.statusEffectId
      ? formatStatusEffectLabel(effect.statusEffectId)
      : null;

    if (hasDirectDamage && statusEffect && effect.statusChance) {
      return t('ui.ability.description.effect.damageWithChanceStatus', {
        school: t(`ui.ability.description.school.${school}`),
        effect: statusEffect,
        verb: t('ui.ability.description.verb.inflict'),
      });
    }
    if (hasDirectDamage) {
      return t('ui.ability.description.effect.damage', {
        school: t(`ui.ability.description.school.${school}`),
      });
    }
    if (statusEffect) {
      return t('ui.ability.description.effect.chanceStatus', {
        effect: statusEffect,
        verb: t(
          enemyTarget
            ? 'ui.ability.description.verb.inflict'
            : 'ui.ability.description.verb.grant',
        ),
      });
    }
    return '';
  }

  if (effect.kind === 'heal') {
    return t(
      effect.splitDivisor && effect.splitDivisor > 1
        ? 'ui.ability.description.effect.healAll'
        : 'ui.ability.description.effect.heal',
    );
  }

  return t(
    effect.permanent
      ? enemyTarget
        ? 'ui.ability.description.effect.debuffPermanent'
        : 'ui.ability.description.effect.buffPermanent'
      : enemyTarget
        ? 'ui.ability.description.effect.debuff'
        : 'ui.ability.description.effect.buff',
    {
      effect: formatStatusEffectLabel(effect.statusEffectId),
    },
  );
}
