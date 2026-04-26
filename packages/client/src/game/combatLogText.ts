import { t } from '../i18n';
import {
  formatAbilityLabel,
  formatSecondaryStatLabel,
  formatStatusEffectLabel,
} from '../i18n/labels';
import type { DamageResolution } from './combatDamage';
import type {
  AbilityId,
  Enemy,
  LogRichSegment,
  SecondaryStatKey,
  StatusEffectId,
} from './types';

export function formatPlayerDamageLog(
  enemyName: string,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
) {
  if (damageResolution.outcome === 'dodged') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKickDodged'
        : 'game.message.combat.playerAbilityDodged',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  if (damageResolution.outcome === 'suppressed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKickSuppressed'
        : 'game.message.combat.playerAbilitySuppressed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
        damage: damageResolution.damage,
      },
    );
  }

  if (damageResolution.outcome === 'absorbed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKickAbsorbed'
        : 'game.message.combat.playerAbilityAbsorbed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  return t(
    abilityId === 'kick'
      ? 'game.message.combat.playerKick'
      : 'game.message.combat.playerAbilityDamage',
    {
      ability: formatAbilityLabel(abilityId),
      enemy: enemyName,
      damage: damageResolution.damage,
      critically: damageResolution.critical
        ? `${t('game.message.combat.criticalAdverb')} `
        : '',
    },
  );
}

export function formatEnemyDamageLog(
  enemyName: string,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
) {
  if (damageResolution.outcome === 'dodged') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickDodged'
        : 'game.message.combat.enemyAbilityDodged',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  if (damageResolution.outcome === 'blocked') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickBlocked'
        : 'game.message.combat.enemyAbilityBlocked',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  if (damageResolution.outcome === 'suppressed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickSuppressed'
        : 'game.message.combat.enemyAbilitySuppressed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
        damage: damageResolution.damage,
      },
    );
  }

  if (damageResolution.outcome === 'absorbed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickAbsorbed'
        : 'game.message.combat.enemyAbilityAbsorbed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  return t(
    abilityId === 'kick'
      ? 'game.message.combat.enemyKick'
      : 'game.message.combat.enemyAbilityDamage',
    {
      ability: formatAbilityLabel(abilityId),
      enemy: enemyName,
      damage: damageResolution.damage,
      critically: damageResolution.critical
        ? `${t('game.message.combat.criticalAdverb')} `
        : '',
    },
  );
}

export function formatPlayerStatHealLog(
  stat: SecondaryStatKey,
  amount: number,
) {
  return t('game.message.combat.playerStatHeal', {
    amount,
    stat: formatSecondaryStatLabel(stat),
  });
}

export function formatSuppressedEnemyDebuffLog(
  enemyName: string,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  return t('game.message.combat.enemyAbilityDebuffSuppressed', {
    ability: formatAbilityLabel(abilityId),
    enemy: enemyName,
    effect: formatStatusEffectLabel(effectId),
  });
}

export function playerDamageRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
  attack?: number,
) {
  const source = abilitySourceSegment(abilityId, attack);

  switch (damageResolution.outcome) {
    case 'dodged':
      return [
        combatEntityName(enemy),
        textSegment(' dodges '),
        source,
        textSegment('.'),
      ];
    case 'suppressed':
      return [
        combatEntityName(enemy),
        textSegment(' takes '),
        damageSegment(damageResolution.damage),
        textSegment(' after suppressing '),
        source,
        textSegment('.'),
      ];
    case 'absorbed':
      return [
        combatEntityName(enemy),
        textSegment(' defended against '),
        source,
        textSegment('.'),
      ];
    default:
      return [
        textSegment(
          damageResolution.critical ? 'You critically hit ' : 'You deal ',
        ),
        combatEntityName(enemy),
        textSegment(' for '),
        damageSegment(damageResolution.damage),
        textSegment(' with '),
        source,
        textSegment('.'),
      ];
  }
}

export function enemyDamageRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
  attack?: number,
) {
  const source = abilitySourceSegment(abilityId, attack);

  switch (damageResolution.outcome) {
    case 'dodged':
      return [
        textSegment('You evade '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    case 'blocked':
      return [
        textSegment('You blocked '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    case 'suppressed':
      return [
        textSegment('You suppressed damage from '),
        source,
        textSegment(' used by '),
        combatEntityName(enemy),
        textSegment(' and take '),
        damageSegment(damageResolution.damage),
        textSegment('.'),
      ];
    case 'absorbed':
      return [
        textSegment('You defended against '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    default:
      return [
        combatEntityName(enemy),
        textSegment(
          damageResolution.critical ? ' critically hits you for ' : ' deals ',
        ),
        damageSegment(damageResolution.damage),
        textSegment(damageResolution.critical ? ' with ' : ' to you with '),
        source,
        textSegment('.'),
      ];
  }
}

export function playerHealRichText(
  source:
    | { kind: 'ability'; abilityId: AbilityId; attack?: number }
    | { kind: 'secondaryStat'; stat: SecondaryStatKey; text?: string },
  amount: number,
) {
  const sourceSegment =
    source.kind === 'ability'
      ? abilitySourceSegment(source.abilityId, source.attack)
      : secondaryStatSourceSegment(source.stat, source.text);
  return [
    textSegment('You are healed for '),
    healingSegment(amount),
    textSegment(source.kind === 'ability' ? ' with ' : ' through '),
    sourceSegment,
    textSegment('.'),
  ];
}

export function enemyHealRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  amount: number,
  attack?: number,
) {
  return [
    combatEntityName(enemy),
    textSegment(' is healed for '),
    healingSegment(amount),
    textSegment(' with '),
    abilitySourceSegment(abilityId, attack),
    textSegment('.'),
  ];
}

export function playerStatusRichText(
  enemy: Enemy | undefined,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  const effect = statusEffectSourceSegment(effectId);

  return enemy
    ? [
        textSegment('You apply '),
        effect,
        textSegment(' to '),
        combatEntityName(enemy),
        textSegment(' with '),
        abilitySourceSegment(abilityId),
        textSegment('.'),
      ]
    : [
        textSegment('You apply '),
        effect,
        textSegment(' with '),
        abilitySourceSegment(abilityId),
        textSegment('.'),
      ];
}

export function enemyStatusRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  return [
    combatEntityName(enemy),
    textSegment(' afflicts you with '),
    statusEffectSourceSegment(effectId),
    textSegment(' using '),
    abilitySourceSegment(abilityId),
    textSegment('.'),
  ];
}

export function enemyDebuffSuppressedRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  return [
    textSegment('You shrug off '),
    statusEffectSourceSegment(effectId),
    textSegment(' from '),
    abilitySourceSegment(abilityId),
    textSegment(' used by '),
    combatEntityName(enemy),
    textSegment('.'),
  ];
}

export function enemyDefeatedRichText(enemy: Enemy) {
  return [
    textSegment('You defeated '),
    combatEntityName(enemy),
    textSegment('.'),
  ];
}

function textSegment(text: string): LogRichSegment {
  return { kind: 'text', text };
}

function damageSegment(damage: number): LogRichSegment {
  return { kind: 'damage', text: `${damage}` };
}

function healingSegment(amount: number): LogRichSegment {
  return { kind: 'healing', text: `${amount}` };
}

function abilitySourceSegment(
  abilityId: AbilityId,
  attack?: number,
): LogRichSegment {
  return {
    kind: 'source',
    text: formatAbilityLabel(abilityId),
    source: {
      kind: 'ability',
      abilityId,
      attack,
    },
  };
}

function secondaryStatSourceSegment(
  stat: SecondaryStatKey,
  text = formatSecondaryStatLabel(stat),
): LogRichSegment {
  return {
    kind: 'source',
    text,
    source: {
      kind: 'secondaryStat',
      stat,
    },
  };
}

function statusEffectSourceSegment(
  effectId: StatusEffectId,
  tone?: 'buff' | 'debuff',
  effect?: {
    value?: number;
    tickIntervalMs?: number;
    stacks?: number;
  },
): LogRichSegment {
  return {
    kind: 'source',
    text: formatStatusEffectLabel(effectId),
    source: {
      kind: 'statusEffect',
      effectId,
      tone,
      value: effect?.value,
      tickIntervalMs: effect?.tickIntervalMs,
      stacks: effect?.stacks,
    },
  };
}

function combatEntityName(enemy: Enemy) {
  return entitySegment(enemy.name, enemy.rarity ?? 'common', enemy);
}

function entitySegment(
  text: string,
  rarity?: Enemy['rarity'],
  enemy?: Enemy,
): LogRichSegment {
  return { kind: 'entity', text, rarity, enemy };
}
