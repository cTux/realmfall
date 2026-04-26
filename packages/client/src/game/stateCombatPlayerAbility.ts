import { t } from '../i18n';
import { formatAbilityLabel, formatStatusEffectLabel } from '../i18n/labels';
import { getAbilityDefinition } from './abilityCatalog';
import {
  getEnemyCombatDefense,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
  mitigateDamageByDefense,
  resolveIncomingDamageByChances,
} from './combatDamage';
import {
  formatPlayerDamageLog,
  formatPlayerStatHealLog,
  playerDamageRichText,
  playerHealRichText,
  playerStatusRichText,
} from './combatLogText';
import { resolveCombatProcCount } from './combatProcs';
import {
  applyLifesteal,
  applyPlayerOnHitEffects,
  applyStatusEffectToEnemy,
  applyStatusEffectToPlayer,
  maybeApplyConfiguredStatusToEnemy,
} from './combatStatus';
import { resolveEnemyTargetsForPlayerAbility } from './combatTargeting';
import { addLog } from './logs';
import { getPlayerCombatStats } from './progression';
import { handleEnemyDefeat } from './stateCombatEnemyDefeat';
import type { AbilityId, GameState } from './types';

export function applyPlayerAbility(
  state: GameState,
  abilityId: AbilityId,
  targetId: string,
) {
  const ability = getAbilityDefinition(abilityId);
  const playerStats = getPlayerCombatStats(state.player);
  const enemyTargets = resolveEnemyTargetsForPlayerAbility(
    state,
    ability,
    targetId,
  );
  let totalDamage = 0;

  for (const effect of ability.effects) {
    if (effect.kind === 'damage') {
      for (const enemy of enemyTargets) {
        if (enemy.hp <= 0) continue;
        totalDamage += dealPlayerDamageToEnemy(
          state,
          abilityId,
          enemy,
          effect,
          playerStats,
        );
      }
      continue;
    }

    if (effect.kind === 'heal') {
      const healed = healPlayerTargets(
        state,
        ability,
        effect,
        playerStats.attack,
      );
      if (healed > 0) {
        addLog(
          state,
          'combat',
          t('game.message.combat.playerAbilityHeal', {
            ability: formatAbilityLabel(ability.id),
            amount: healed,
          }),
          playerHealRichText(
            {
              kind: 'ability',
              abilityId: ability.id,
              attack: playerStats.attack,
            },
            healed,
          ),
        );
      }
      continue;
    }

    const applied = applyPlayerStatusTargets(state, ability, effect, targetId);
    if (applied > 0) {
      addLog(
        state,
        'combat',
        t('game.message.combat.playerAbilityStatus', {
          ability: formatAbilityLabel(ability.id),
          effect: formatStatusEffectLabel(effect.statusEffectId),
        }),
        applied === 1 && enemyTargets.length === 1
          ? playerStatusRichText(
              enemyTargets[0],
              ability.id,
              effect.statusEffectId,
            )
          : playerStatusRichText(undefined, ability.id, effect.statusEffectId),
      );
    }
  }

  if (totalDamage > 0) {
    const lifestealHealed = applyLifesteal(state, totalDamage, playerStats);
    if (lifestealHealed > 0) {
      addLog(
        state,
        'combat',
        formatPlayerStatHealLog('lifestealAmount', lifestealHealed),
        playerHealRichText(
          {
            kind: 'secondaryStat',
            stat: 'lifestealAmount',
            text: t('ui.combat.lifestealLabel'),
          },
          lifestealHealed,
        ),
      );
    }
  }

  enemyTargets.forEach((enemy) => {
    if (enemy.hp <= 0) {
      handleEnemyDefeat(state, enemy);
    }
  });
}

function dealPlayerDamageToEnemy(
  state: GameState,
  abilityId: AbilityId,
  enemy: NonNullable<GameState['enemies'][string]>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'damage' }
  >,
  playerStats: ReturnType<typeof getPlayerCombatStats>,
) {
  const critCount = resolveCombatProcCount(
    state,
    `player:${enemy.id}:${abilityId}:crit`,
    playerStats.criticalStrikeChance ?? 0,
  );
  const critMultiplier = Math.pow(
    Math.max(1, (playerStats.criticalStrikeDamage ?? 100) / 100),
    Math.max(0, critCount),
  );
  const baseDamage = Math.max(
    0,
    Math.round(
      playerStats.attack * effect.powerMultiplier + (effect.flatPower ?? 0),
    ),
  );
  const damage =
    baseDamage <= 0
      ? 0
      : Math.max(
          0,
          Math.round(
            mitigateDamageByDefense(baseDamage, getEnemyCombatDefense(enemy)) *
              critMultiplier,
          ),
        );
  const damageResolution = resolveIncomingDamageByChances(
    state,
    `player:${enemy.id}:${abilityId}`,
    damage,
    getEnemyDodgeChance(enemy),
    0,
    getEnemySuppressDamageChance(enemy),
    getEnemySuppressDamageReduction(enemy),
  );
  damageResolution.critical = critCount > 0;
  enemy.hp = Math.max(0, enemy.hp - damageResolution.damage);
  applyPlayerOnHitEffects(state, enemy, damageResolution.damage, playerStats);
  if (
    damageResolution.outcome !== 'dodged' &&
    damageResolution.outcome !== 'blocked' &&
    damageResolution.outcome !== 'absorbed'
  ) {
    maybeApplyConfiguredStatusToEnemy(state, enemy, effect, playerStats.attack);
  }
  addLog(
    state,
    'combat',
    formatPlayerDamageLog(enemy.name, abilityId, damageResolution),
    playerDamageRichText(
      enemy,
      abilityId,
      damageResolution,
      playerStats.attack,
    ),
  );
  return damageResolution.damage;
}

function healPlayerTargets(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'heal' }
  >,
  power: number,
) {
  const targets =
    ability.target === 'allAllies' ? [state.player] : [state.player];
  return targets.reduce((sum, target) => {
    const amount = Math.max(
      1,
      Math.round(
        (power * effect.powerMultiplier + (effect.flatPower ?? 0)) /
          Math.max(1, effect.splitDivisor ?? 1),
      ),
    );
    const maxHp = getPlayerCombatStats(state.player).maxHp;
    const healed = Math.max(0, Math.min(maxHp - target.hp, amount));
    target.hp += healed;
    return sum + healed;
  }, 0);
}

function applyPlayerStatusTargets(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'applyStatus' }
  >,
  targetId: string,
) {
  if (
    ability.target === 'allEnemies' ||
    ability.target === 'enemy' ||
    ability.target === 'randomEnemy'
  ) {
    return resolveEnemyTargetsForPlayerAbility(state, ability, targetId).reduce(
      (count, enemy) =>
        count +
        (applyStatusEffectToEnemy(state, enemy, {
          id: effect.statusEffectId,
          value: effect.value,
          expiresAt: effect.permanent
            ? undefined
            : state.worldTimeMs + (effect.durationMs ?? 0),
          tickIntervalMs: effect.tickIntervalMs,
          stacks: effect.stacks ?? 1,
        })
          ? 1
          : 0),
      0,
    );
  }

  return applyStatusEffectToPlayer(state, {
    id: effect.statusEffectId,
    value: effect.value,
    expiresAt: effect.permanent
      ? undefined
      : state.worldTimeMs + (effect.durationMs ?? 0),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  })
    ? 1
    : 0;
}
