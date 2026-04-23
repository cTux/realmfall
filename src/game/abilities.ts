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
import { formatAbilityLabel, formatStatusEffectLabel } from '../i18n/labels';
import {
  ABILITY_RUNTIME_DEFINITIONS,
  DEFAULT_ABILITY_ID,
  getAbilityDefinition as getAbilityRuntimeDefinition,
} from './abilityCatalog';
import {
  buildEnemyAbilityIds,
  buildEquippedAbilityIds,
  enemyAbilityCount,
  sortAbilityIdsForCombat,
} from './abilityRuntime';
import type {
  AbilityDefinition,
  AbilityId,
  AbilityRuntimeDefinition,
} from './types';

const ABILITY_ICONS: Record<AbilityId, string> = {
  kick: smashingArrowsIcon,
  slash: swordSliceIcon,
  crushingBlow: swordClashIcon,
  hamstring: thrownSpearIcon,
  whirlwind: whirlwindIcon,
  impale: fireRayIcon,
  emberShot: fireRayIcon,
  fireball: fireballIcon,
  searingNova: fireRingIcon,
  cinderBurst: threeBurningBallsIcon,
  magmaStrike: fireWaveIcon,
  wildfire: wildfiresIcon,
  sparkJolt: lightningArcIcon,
  arcBolt: thunderballIcon,
  thunderClap: thunderStruckIcon,
  chainLightning: chainLightningIcon,
  stormSurge: lightningStormIcon,
  staticField: staticWavesIcon,
  frostShard: iceBoltIcon,
  iceLance: iceSpearIcon,
  freezingWave: icebergsIcon,
  coldSnap: snowflakeIcon,
  blizzard: personInBlizzardIcon,
  brainFreeze: brainFreezeIcon,
  mendWounds: heartPlusIcon,
  fieldDressing: healthPotionIcon,
  soothingMist: healingIcon,
  rallyingCry: knightBannerIcon,
  battlePrayer: sparklesIcon,
  warBanner: verticalBannerIcon,
  ironGuard: shieldIcon,
  arcWard: magicShieldIcon,
  witheringHex: heartMinusIcon,
  sunderArmor: heartMinusIcon,
  enfeeblingPulse: heartMinusIcon,
};

export const ABILITIES: Record<AbilityId, AbilityDefinition> =
  Object.fromEntries(
    Object.entries(ABILITY_RUNTIME_DEFINITIONS).map(
      ([abilityId, definition]) => [
        abilityId,
        {
          ...definition,
          name: formatAbilityLabel(abilityId),
          description: buildAbilityDescription(definition),
          icon: ABILITY_ICONS[abilityId] ?? smashingArrowsIcon,
        },
      ],
    ),
  ) as Record<AbilityId, AbilityDefinition>;

export function getAbilityDefinition(abilityId: AbilityId) {
  return ABILITIES[abilityId] ?? ABILITIES[DEFAULT_ABILITY_ID];
}

export {
  buildEnemyAbilityIds,
  buildEquippedAbilityIds,
  DEFAULT_ABILITY_ID,
  enemyAbilityCount,
  getAbilityRuntimeDefinition,
  sortAbilityIdsForCombat,
};

function buildAbilityDescription(
  ability: Pick<AbilityRuntimeDefinition, 'target' | 'effects' | 'school'>,
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
  effect: AbilityRuntimeDefinition['effects'][number],
  defaultTarget: AbilityRuntimeDefinition['target'],
  school: AbilityRuntimeDefinition['school'],
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
      defaultTarget === 'allAllies'
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
