import {
  getStatusEffectDefinition,
  getStatusEffectTags,
} from '../../game/content/statusEffects';
import type {
  AbilityDefinition,
  PlayerStatusEffect,
  StatusEffectId,
} from '../../game/types';
import { t } from '../../i18n';
import { formatStatusEffectLabel } from '../../i18n/labels';
import { type TooltipLine, tagTooltipLines } from './shared';

export function abilityTooltipLines(
  ability: Pick<
    AbilityDefinition,
    | 'description'
    | 'manaCost'
    | 'cooldownMs'
    | 'castTimeMs'
    | 'category'
    | 'effects'
    | 'tags'
  >,
  target: AbilityDefinition['target'] = 'enemy',
  attack = 0,
): TooltipLine[] {
  const damageLine =
    ability.category === 'attacking'
      ? {
          kind: 'stat' as const,
          label: t('ui.ability.damage'),
          value: `${abilityDamageValue(ability, attack)}`,
        }
      : null;

  return [
    {
      kind: 'text',
      text: ability.description,
    },
    ...abilityStatusEffectLines(ability),
    ...(damageLine ? [damageLine] : []),
    {
      kind: 'stat',
      label: t('ui.ability.manaCost'),
      value: `${ability.manaCost}`,
    },
    {
      kind: 'stat',
      label: t('ui.ability.cooldown'),
      value: `${ability.cooldownMs / 1000}s`,
    },
    {
      kind: 'stat',
      label: t('ui.ability.castTime'),
      value:
        ability.castTimeMs === 0
          ? t('ui.ability.instant')
          : `${ability.castTimeMs / 1000}s`,
    },
    {
      kind: 'text',
      text: t(`ui.ability.target.${target}`),
    },
    ...tagTooltipLines(ability.tags),
  ];
}

export function statusEffectTooltipLines(
  effectId: StatusEffectId,
  tone: 'buff' | 'debuff',
  extraLines: TooltipLine[] = [],
  effect?: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
  >,
  worldTimeMs?: number,
): TooltipLine[] {
  const descriptionKeyByEffect: Partial<Record<StatusEffectId, string>> = {
    hunger: 'ui.hero.effect.hunger.description',
    thirst: 'ui.hero.effect.thirst.description',
    recentDeath: 'ui.hero.effect.recentDeath.description',
    restoration: 'ui.hero.effect.restoration.description',
    bleeding: 'ui.hero.effect.bleeding.description',
    poison: 'ui.hero.effect.poison.description',
    burning: 'ui.hero.effect.burning.description',
    chilling: 'ui.hero.effect.chilling.description',
    power: 'ui.hero.effect.power.description',
    frenzy: 'ui.hero.effect.frenzy.description',
    guard: 'ui.hero.effect.guard.description',
    weakened: 'ui.hero.effect.weakened.description',
    shocked: 'ui.hero.effect.shocked.description',
  };
  const description = t(
    descriptionKeyByEffect[effectId] ??
      (tone === 'buff' ? 'ui.hero.effect.buff' : 'ui.hero.effect.debuff'),
  );

  return [
    {
      kind: 'text',
      text: description,
    },
    ...statusEffectDamageLines(effect),
    ...statusEffectDecayLines(effect, tone, worldTimeMs),
    ...extraLines,
    ...tagTooltipLines(getStatusEffectTags(effectId)),
  ];
}

function abilityDamageValue(
  ability: Pick<AbilityDefinition, 'effects'>,
  attack: number,
) {
  return ability.effects.reduce((total, effect) => {
    if (effect.kind !== 'damage') return total;

    return (
      total +
      Math.max(
        0,
        Math.round(attack * effect.powerMultiplier + (effect.flatPower ?? 0)),
      )
    );
  }, 0);
}

function abilityStatusEffectLines(
  ability: Pick<AbilityDefinition, 'effects'>,
): TooltipLine[] {
  const statusEffects = [
    ...new Set(
      ability.effects.flatMap((effect) => {
        if (effect.kind === 'heal') return [];
        return effect.statusEffectId ? [effect.statusEffectId] : [];
      }),
    ),
  ];

  return statusEffects.map((effectId) => {
    const definition = getStatusEffectDefinition(effectId);

    return {
      kind: 'stat' as const,
      label: t('ui.ability.effect'),
      value: formatStatusEffectLabel(effectId),
      icon: definition?.icon,
      iconTint: definition?.tint,
      tone:
        definition?.tone === 'debuff'
          ? ('negative' as const)
          : ('item' as const),
    };
  });
}

function statusEffectDamageLines(
  effect?: Pick<
    PlayerStatusEffect,
    'id' | 'value' | 'tickIntervalMs' | 'stacks' | 'expiresAt'
  >,
) {
  if (!effect) return [];

  const intervalSeconds = formatStatusIntervalSeconds(effect.tickIntervalMs);

  switch (effect.id) {
    case 'bleeding':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.damage'),
          value: t('ui.hero.effect.damagePerInterval', {
            amount: Math.max(1, Math.floor(effect.value ?? 0)),
            seconds: intervalSeconds,
          }),
          tone: 'negative' as const,
        },
      ];
    case 'burning':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.damage'),
          value: t('ui.hero.effect.damagePerInterval', {
            amount:
              Math.max(1, Math.floor(effect.value ?? 0)) *
              Math.max(1, effect.stacks ?? 1),
            seconds: intervalSeconds,
          }),
          tone: 'negative' as const,
        },
      ];
    case 'poison':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.damage'),
          value: t('ui.hero.effect.damagePercentPerInterval', {
            amount: Math.max(1, effect.stacks ?? 1),
            seconds: intervalSeconds,
          }),
          tone: 'negative' as const,
        },
      ];
    default:
      return [];
  }
}

function statusEffectDecayLines(
  effect:
    | Pick<
        PlayerStatusEffect,
        'id' | 'expiresAt' | 'tickIntervalMs' | 'stacks' | 'value'
      >
    | undefined,
  tone: 'buff' | 'debuff',
  worldTimeMs?: number,
) {
  if (effect?.expiresAt == null || worldTimeMs == null) {
    return [];
  }

  const remainingMs = effect.expiresAt - worldTimeMs;
  if (remainingMs <= 0) return [];

  const decayTone: TooltipLine['tone'] = tone === 'buff' ? 'item' : 'negative';

  return [
    {
      kind: 'stat' as const,
      label: t('ui.tooltip.timeToDecay'),
      value: formatMillisecondsToMinutesSeconds(remainingMs),
      tone: decayTone,
    },
  ];
}

function formatStatusIntervalSeconds(tickIntervalMs = 1_000) {
  const seconds = tickIntervalMs / 1000;
  return Number.isInteger(seconds) ? `${seconds}` : seconds.toFixed(1);
}

function formatMillisecondsToMinutesSeconds(milliseconds: number) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
