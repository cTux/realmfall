import { hexKey, type HexCoord } from './hex';
import { t } from '../i18n';
import { formatAbilityLabel, formatStatusEffectLabel } from '../i18n/labels';
import { getAbilityDefinition } from './abilityRuntime';
import { createCombatActorState } from './combat';
import {
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemyMana,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
  resolveIncomingDamage,
  resolveIncomingDamageByChances,
  scaleCombatCooldownMs,
} from './combatDamage';
import {
  enemyDebuffSuppressedRichText,
  enemyDefeatedRichText,
  enemyDamageRichText,
  enemyHealRichText,
  enemyStatusRichText,
  formatEnemyDamageLog,
  formatPlayerDamageLog,
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
  getNextCombatStatusEffectEventAt,
  maybeApplyConfiguredStatusToEnemy,
  maybeApplyConfiguredStatusToPlayer,
  processEnemyStatusEffects,
  type PlayerDebuffApplicationResult,
} from './combatStatus';
import {
  canActorCastAbility,
  canEnemyUseAbility,
  getNextActorReadyAt,
  resolveEnemyTargetsForEnemyAbility,
  resolveEnemyTargetsForPlayerAbility,
  selectAbilityTargetId,
} from './combatTargeting';
import { addLog } from './logs';
import { getPlayerStats, gainXp } from './progression';
import { cloneForWorldMutation, message } from './stateMutationHelpers';
import { dropEnemyRewards } from './stateRewards';
import {
  processPlayerStatusEffects,
  respawnAtNearestTown,
} from './stateSurvival';
import { buildTile, normalizeStructureState } from './world';
import type { AbilityId, GameState } from './types';

export {
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
};

export function attackCombatEnemy(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (!state.combat.started)
    return message(state, t('game.message.combat.pressStart'));

  return progressCombat(state);
}

export function progressCombat(state: GameState): GameState {
  if (!state.combat || !state.combat.started) return state;

  const next = cloneForWorldMutation(state);
  const changed = resolveCombat(next);
  return changed ? next : state;
}

export function startCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (state.combat.started) return state;

  const next = cloneForWorldMutation(state);
  next.combat!.started = true;
  addLog(
    next,
    'combat',
    t(
      next.combat!.enemyIds.length === 1
        ? 'game.message.combat.begin.one'
        : 'game.message.combat.begin.other',
      { count: next.combat!.enemyIds.length },
    ),
  );
  resolveCombat(next);
  return next;
}

export function getCombatAutomationDelay(
  state: Pick<GameState, 'combat' | 'player' | 'enemies'>,
  worldTimeMs: number,
) {
  const { combat } = state;
  if (!combat || combat.enemyIds.length === 0) return null;

  const eventTimes = [
    combat.player.casting?.endsAt,
    getNextActorReadyAt(combat.player, worldTimeMs),
    getNextCombatStatusEffectEventAt(state.player.statusEffects, worldTimeMs),
    ...combat.enemyIds.flatMap((enemyId) => {
      const actor = combat.enemies[enemyId];
      if (!actor) return [] as Array<number | undefined>;

      return [
        actor.casting?.endsAt,
        getNextActorReadyAt(actor, worldTimeMs),
        getNextCombatStatusEffectEventAt(
          state.enemies[enemyId]?.statusEffects,
          worldTimeMs,
        ),
      ];
    }),
  ].filter((value): value is number => Number.isFinite(value));

  if (eventTimes.length === 0) return null;

  return Math.max(0, Math.min(...eventTimes) - worldTimeMs);
}

export function createCombatState(
  state: GameState,
  coord: HexCoord,
  enemyIds: string[],
  worldTimeMs: number,
): GameState['combat'] {
  return {
    coord,
    enemyIds: [...enemyIds],
    started: false,
    player: createCombatActorState(
      worldTimeMs,
      getPlayerStats(state.player).abilityIds,
    ),
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatActorState(worldTimeMs, state.enemies[enemyId]?.abilityIds),
      ]),
    ),
  };
}

function resolveCombat(state: GameState) {
  if (!state.combat) return false;

  let changed = false;
  let keepResolving = true;

  while (state.combat && keepResolving) {
    keepResolving = false;
    const playerEffectsChanged = processPlayerStatusEffects(state);
    const enemyEffectsChanged = processEnemyStatusEffects(
      state,
      handleEnemyDefeat,
    );
    if (playerEffectsChanged || enemyEffectsChanged) {
      changed = true;
      if (state.player.hp <= 0 && state.combat) {
        respawnAtNearestTown(state, state.combat.coord);
        return true;
      }
      if (!state.combat) return true;
    }

    const duePlayerCast =
      state.combat.player.casting &&
      state.combat.player.casting.endsAt <= state.worldTimeMs
        ? state.combat.player.casting
        : null;
    const dueEnemyCasts = state.combat.enemyIds
      .map((enemyId) => ({ enemyId, actor: state.combat?.enemies[enemyId] }))
      .filter((entry) => Boolean(entry.actor?.casting))
      .map(({ enemyId, actor }) => ({ enemyId, cast: actor!.casting! }))
      .filter(({ cast }) => cast.endsAt <= state.worldTimeMs);

    if (duePlayerCast || dueEnemyCasts.length > 0) {
      changed = true;
      keepResolving = true;
      if (duePlayerCast) state.combat.player.casting = null;
      dueEnemyCasts.forEach(({ enemyId }) => {
        const actor = state.combat?.enemies[enemyId];
        if (actor) actor.casting = null;
      });

      if (duePlayerCast) {
        applyPlayerAbility(
          state,
          duePlayerCast.abilityId,
          duePlayerCast.targetId,
        );
      }
      dueEnemyCasts.forEach(({ enemyId, cast }) => {
        applyEnemyAbility(state, enemyId, cast.abilityId);
      });
      if (!state.combat) return true;
    }

    const startedPlayerCast = startPlayerCasts(state);
    const startedEnemyCast = startEnemyCasts(state);
    changed = changed || startedPlayerCast || startedEnemyCast;
    keepResolving = keepResolving || startedPlayerCast || startedEnemyCast;
  }

  return changed;
}

function startPlayerCasts(state: GameState) {
  if (!state.combat) return false;

  const actor = state.combat.player;
  const now = state.worldTimeMs;
  if (actor.casting) return false;

  const abilityId = actor.abilityIds.find((candidate) => {
    const ability = getAbilityDefinition(candidate);
    const targetId = selectAbilityTargetId(state, 'player', candidate);
    return (
      canActorCastAbility(actor, candidate, now) &&
      state.player.mana >= ability.manaCost &&
      targetId !== null
    );
  });
  if (!abilityId) return false;

  const targetId = selectAbilityTargetId(state, 'player', abilityId);
  if (!targetId) return false;

  state.player.mana -= getAbilityDefinition(abilityId).manaCost;
  startAbilityCast(
    actor,
    abilityId,
    targetId,
    now,
    getPlayerStats(state.player).attackSpeed ?? 1,
  );
  return true;
}

function startEnemyCasts(state: GameState) {
  if (!state.combat) return false;

  const now = state.worldTimeMs;
  let changed = false;

  state.combat.enemyIds.forEach((enemyId) => {
    const actor = state.combat?.enemies[enemyId];
    if (!actor || actor.casting || !state.enemies[enemyId]) return;

    const abilityId = actor.abilityIds.find((candidate) => {
      const definition = getAbilityDefinition(candidate);
      const targetId = selectAbilityTargetId(state, enemyId, candidate);
      return (
        canActorCastAbility(actor, candidate, now) &&
        targetId !== null &&
        canEnemyUseAbility(state, enemyId, candidate, definition.target)
      );
    });

    if (!abilityId) return;

    const targetId = selectAbilityTargetId(state, enemyId, abilityId);
    if (!targetId) return;

    state.enemies[enemyId]!.mana = Math.max(
      0,
      getEnemyMana(state.enemies[enemyId]!) -
        getAbilityDefinition(abilityId).manaCost,
    );
    startAbilityCast(
      actor,
      abilityId,
      targetId,
      now,
      getEnemyCombatAttackSpeed(state.enemies[enemyId]!),
    );
    changed = true;
  });

  return changed;
}

function startAbilityCast(
  actor: NonNullable<GameState['combat']>['player'],
  abilityId: AbilityId,
  targetId: string,
  now: number,
  attackSpeed = 1,
) {
  const ability = getAbilityDefinition(abilityId);
  const effectiveGlobalCooldownMs = scaleCombatCooldownMs(
    actor.globalCooldownMs,
    attackSpeed,
  );
  const effectiveAbilityCooldownMs = scaleCombatCooldownMs(
    ability.cooldownMs,
    attackSpeed,
  );
  actor.effectiveGlobalCooldownMs = effectiveGlobalCooldownMs;
  actor.effectiveCooldownMs = {
    ...(actor.effectiveCooldownMs ?? {}),
    [abilityId]: effectiveAbilityCooldownMs,
  };
  actor.globalCooldownEndsAt = now + effectiveGlobalCooldownMs;
  actor.cooldownEndsAt[abilityId] = now + effectiveAbilityCooldownMs;
  actor.casting = {
    abilityId,
    targetId,
    endsAt: now + ability.castTimeMs,
  };
}

function applyPlayerAbility(
  state: GameState,
  abilityId: AbilityId,
  targetId: string,
) {
  const ability = getAbilityDefinition(abilityId);
  const playerStats = getPlayerStats(state.player);
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
          playerHealRichText(ability.id, healed, playerStats.attack),
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
    applyLifesteal(state, totalDamage, playerStats);
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
  playerStats: ReturnType<typeof getPlayerStats>,
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
            Math.max(0, baseDamage - getEnemyCombatDefense(enemy)) *
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
    const maxHp = getPlayerStats(state.player).maxHp;
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

function handleEnemyDefeat(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
) {
  if (!state.enemies[enemy.id]) return;

  gainXp(state, enemy.xp, addLog);
  dropEnemyRewards(state, enemy);
  addLog(
    state,
    'combat',
    t('game.message.combat.enemyDefeated', { enemy: enemy.name }),
    enemyDefeatedRichText(enemy),
  );
  delete state.enemies[enemy.id];
  syncCombatEnemies(state);
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

function applyEnemyAbility(
  state: GameState,
  enemyId: string,
  abilityId: AbilityId,
) {
  if (!state.combat) return;

  const enemy = state.enemies[enemyId];
  if (!enemy) return;

  const ability = getAbilityDefinition(abilityId);
  const playerStats = getPlayerStats(state.player);
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
              Math.max(0, baseDamage - playerStats.defense) * critMultiplier,
            ),
          );
        })(),
        playerStats,
      );
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

function syncCombatEnemies(state: GameState) {
  if (!state.combat) return;
  const tile =
    state.tiles[hexKey(state.combat.coord)] ??
    buildTile(state.seed, state.combat.coord);
  const enemyIds = tile.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );
  state.tiles[hexKey(state.combat.coord)] = normalizeStructureState({
    ...tile,
    enemyIds,
  });
  const worldTimeMs = state.worldTimeMs;
  state.combat.enemies = Object.fromEntries(
    enemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );
  state.combat.enemyIds = enemyIds;
  if (enemyIds.length === 0) {
    state.combat = null;
    addLog(state, 'combat', t('game.message.combat.over'));
  }
}
