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
import { ABILITY_ICON_IDS } from './content/iconIds';

const ABILITY_ICONS: Record<AbilityId, string> = ABILITY_ICON_IDS;

export const ABILITIES: Record<AbilityId, AbilityDefinition> =
  Object.fromEntries(
    Object.entries(ABILITY_RUNTIME_DEFINITIONS).map(
      ([abilityId, definition]) => [
        abilityId,
        {
          ...definition,
          name: formatAbilityLabel(abilityId),
          description: buildAbilityDescription(definition),
          icon: ABILITY_ICONS[abilityId] ?? ABILITY_ICON_IDS.kick,
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
