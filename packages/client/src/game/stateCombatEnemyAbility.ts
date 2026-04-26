import { t } from '../i18n';
import { formatAbilityLabel, formatStatusEffectLabel } from '../i18n/labels';
import { getAbilityDefinition } from './abilityCatalog';
import {
  getEnemyCombatAttack,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  mitigateDamageByDefense,
  resolveIncomingDamage,
} from './combatDamage';
import {
  enemyDebuffSuppressedRichText,
  enemyDamageRichText,
  enemyHealRichText,
  enemyStatusRichText,
  formatEnemyDamageLog,
  formatSuppressedEnemyDebuffLog,
} from './combatLogText';
import { resolveCombatProcCount } from './combatProcs';
import {
  applyEnemyStatusEffectToPlayer,
  applyStatusEffectToEnemy,
  maybeApplyConfiguredStatusToPlayer,
  type PlayerDebuffApplicationResult,
} from './combatStatus';
import { resolveEnemyTargetsForEnemyAbility } from './combatTargeting';
import { addLog } from './logs';
import { getPlayerCombatStats } from './progression';
import { respawnAtNearestTown } from './stateSurvival';
import type { AbilityId, GameState } from './types';

export function applyEnemyAbility(
  state: GameState,
  enemyId: string,
  abilityId: AbilityId,
) {
  if (!state.combat) return;

  const enemy = state.enemies[enemyId];
  if (!enemy) return;

  const ability = getAbilityDefinition(abilityId);
  const playerStats = getPlayerCombatStats(state.player);
  for (const effect of ability.effects) {
    if (effect.kind === 'damage') {
      const critCount = resolveCombatProcCount(
        state,
        `enemy:${enemy.id}:${abilityId}:crit`,
        getEnemyCriticalStrikeChance(enemy),
      );
      const critMultiplier = Math.pow(
        Math.max(1, getEnemyCriticalStrikeDamage(enemy) / 100),
        Math.max(0, critCount),
      );
      const damageResolution = resolveIncomingDamage(
        state,
        `enemy:${enemy.id}:${abilityId}:player`,
        (() => {
          const baseDamage = Math.max(
            0,
            Math.round(
              getEnemyCombatAttack(enemy) * effect.powerMultiplier +
                (effect.flatPower ?? 0),
            ),
          );
          if (baseDamage <= 0) return 0;

          return Math.max(
            0,
            Math.round(
              mitigateDamageByDefense(baseDamage, playerStats.defense) *
                critMultiplier,
            ),
          );
        })(),
        playerStats,
      );
      damageResolution.critical = critCount > 0;
      if (damageResolution.damage > 0) {
        state.player.hp = Math.max(
          0,
          state.player.hp - damageResolution.damage,
        );
      }
      const debuffApplication =
        damageResolution.outcome === 'dodged' ||
        damageResolution.outcome === 'blocked' ||
        damageResolution.outcome === 'absorbed'
          ? ('none' satisfies PlayerDebuffApplicationResult)
          : maybeApplyConfiguredStatusToPlayer(
              state,
              effect,
              getEnemyCombatAttack(enemy),
              abilityId,
              enemy.id,
            );
      addLog(
        state,
        'combat',
        formatEnemyDamageLog(enemy.name, ability.id, damageResolution),
        enemyDamageRichText(
          enemy,
          ability.id,
          damageResolution,
          getEnemyCombatAttack(enemy),
        ),
      );
      if (debuffApplication === 'suppressed' && effect.statusEffectId) {
        addLog(
          state,
          'combat',
          formatSuppressedEnemyDebuffLog(
            enemy.name,
            ability.id,
            effect.statusEffectId,
          ),
          enemyDebuffSuppressedRichText(
            enemy,
            ability.id,
            effect.statusEffectId,
          ),
        );
      }
      continue;
    }

    if (effect.kind === 'heal') {
      const healed = healEnemyTargets(state, enemyId, ability, effect);
      if (healed > 0) {
        addLog(
          state,
          'combat',
          t('game.message.combat.enemyAbilityHeal', {
            ability: formatAbilityLabel(ability.id),
            enemy: enemy.name,
            amount: healed,
          }),
          enemyHealRichText(
            enemy,
            ability.id,
            healed,
            getEnemyCombatAttack(enemy),
          ),
        );
      }
      continue;
    }

    const statusApplication = applyEnemyStatusTargets(
      state,
      enemyId,
      ability,
      effect,
    );
    if (statusApplication.applied > 0) {
      addLog(
        state,
        'combat',
        t('game.message.combat.enemyAbilityStatus', {
          ability: formatAbilityLabel(ability.id),
          enemy: enemy.name,
          effect: formatStatusEffectLabel(effect.statusEffectId),
        }),
        enemyStatusRichText(enemy, ability.id, effect.statusEffectId),
      );
    }
    if (statusApplication.suppressed > 0) {
      addLog(
        state,
        'combat',
        formatSuppressedEnemyDebuffLog(
          enemy.name,
          ability.id,
          effect.statusEffectId,
        ),
        enemyDebuffSuppressedRichText(enemy, ability.id, effect.statusEffectId),
      );
    }
  }

  if (state.player.hp <= 0) {
    respawnAtNearestTown(state, state.combat.coord);
  }
}

function healEnemyTargets(
  state: GameState,
  enemyId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'heal' }
  >,
) {
  const targets = resolveEnemyTargetsForEnemyAbility(state, enemyId, ability);
  return targets.reduce((sum, enemy) => {
    const amount = Math.max(
      1,
      Math.round(
        (getEnemyCombatAttack(state.enemies[enemyId]!) *
          effect.powerMultiplier +
          (effect.flatPower ?? 0)) /
          Math.max(1, effect.splitDivisor ?? 1),
      ),
    );
    const healed = Math.max(0, Math.min(enemy.maxHp - enemy.hp, amount));
    enemy.hp += healed;
    return sum + healed;
  }, 0);
}

function applyEnemyStatusTargets(
  state: GameState,
  enemyId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'applyStatus' }
  >,
) {
  if (
    ability.target === 'allAllies' ||
    ability.target === 'randomAlly' ||
    ability.target === 'injuredAlly' ||
    ability.target === 'self'
  ) {
    return {
      applied: resolveEnemyTargetsForEnemyAbility(
        state,
        enemyId,
        ability,
      ).reduce(
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
      ),
      suppressed: 0,
    };
  }

  const result = applyEnemyStatusEffectToPlayer(
    state,
    {
      id: effect.statusEffectId,
      value: effect.value,
      expiresAt: effect.permanent
        ? undefined
        : state.worldTimeMs + (effect.durationMs ?? 0),
      tickIntervalMs: effect.tickIntervalMs,
      stacks: effect.stacks ?? 1,
    },
    `${enemyId}:${ability.id}:${effect.statusEffectId}`,
  );

  return {
    applied: result === 'applied' ? 1 : 0,
    suppressed: result === 'suppressed' ? 1 : 0,
  };
}
