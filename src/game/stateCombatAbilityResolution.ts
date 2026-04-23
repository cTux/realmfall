import { t } from '../i18n';
import { formatAbilityLabel, formatStatusEffectLabel } from '../i18n/labels';
import { getAbilityDefinition } from './abilityCatalog';
import {
  getEnemyCombatAttack,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
  mitigateDamageByDefense,
  resolveIncomingDamage,
  resolveIncomingDamageByChances,
} from './combatDamage';
import {
  enemyDebuffSuppressedRichText,
  enemyDefeatedRichText,
  enemyDamageRichText,
  enemyHealRichText,
  enemyStatusRichText,
  formatEnemyDamageLog,
  formatPlayerDamageLog,
  formatPlayerStatHealLog,
  formatSuppressedEnemyDebuffLog,
  playerDamageRichText,
  playerHealRichText,
  playerStatusRichText,
} from './combatLogText';
import { resolveCombatProcCount } from './combatProcs';
import {
  applyEnemyStatusEffectToPlayer,
  applyLifesteal,
  applyPlayerOnHitEffects,
  applyStatusEffectToEnemy,
  applyStatusEffectToPlayer,
  maybeApplyConfiguredStatusToEnemy,
  maybeApplyConfiguredStatusToPlayer,
  type PlayerDebuffApplicationResult,
} from './combatStatus';
import {
  resolveEnemyTargetsForEnemyAbility,
  resolveEnemyTargetsForPlayerAbility,
} from './combatTargeting';
import { BASE_ENEMY_XP } from './config';
import { addLog } from './logs';
import { getPlayerCombatStats, gainXp } from './progression';
import { dropEnemyRewards } from './stateRewards';
import { respawnAtNearestTown } from './stateSurvival';
import { syncCombatEncounterEnemies } from './stateCombatEncounterSync';
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
        const damage = dealPlayerDamageToEnemy(
          state,
          abilityId,
          enemy,
          effect,
          playerStats,
        );
        totalDamage += damage;
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
  const total = targets.reduce((sum, target) => {
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

  return total;
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

export function handleEnemyDefeat(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
) {
  if (!state.enemies[enemy.id]) return;

  gainXp(state, BASE_ENEMY_XP, addLog, enemy.tier);
  dropEnemyRewards(state, enemy);
  addLog(
    state,
    'combat',
    t('game.message.combat.enemyDefeated', { enemy: enemy.name }),
    enemyDefeatedRichText(enemy),
  );
  delete state.enemies[enemy.id];
  syncCombatEncounterEnemies(state);
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
  const total = targets.reduce((sum, enemy) => {
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

  return total;
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
