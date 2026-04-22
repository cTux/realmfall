import { t } from '../i18n';
import { formatAbilityLabel, formatStatusEffectLabel } from '../i18n/labels';
import type { DamageResolution } from './combatDamage';
import type { AbilityId, Enemy, LogRichSegment, StatusEffectId } from './types';

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
    },
  );
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
        textSegment(' fully absorbs '),
        source,
        textSegment('.'),
      ];
    default:
      return [
        textSegment('You deal '),
        damageSegment(damageResolution.damage),
        textSegment(' to '),
        combatEntityName(enemy),
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
        textSegment('You dodge '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    case 'blocked':
      return [
        textSegment('You block '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    case 'suppressed':
      return [
        combatEntityName(enemy),
        textSegment(' deals '),
        damageSegment(damageResolution.damage),
        textSegment(' to you with '),
        source,
        textSegment(' after suppression.'),
      ];
    case 'absorbed':
      return [
        textSegment('You fully absorb '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    default:
      return [
        combatEntityName(enemy),
        textSegment(' deals '),
        damageSegment(damageResolution.damage),
        textSegment(' to you with '),
        source,
        textSegment('.'),
      ];
  }
}

export function playerHealRichText(
  abilityId: AbilityId,
  amount: number,
  attack?: number,
) {
  return [
    textSegment('You restore '),
    healingSegment(amount),
    textSegment(' with '),
    abilitySourceSegment(abilityId, attack),
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
    textSegment(' restores '),
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

function entitySegment(text: string, rarity?: Enemy['rarity']): LogRichSegment {
  return { kind: 'entity', text, rarity };
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
  return entitySegment(enemy.name, enemy.rarity ?? 'common');
}
