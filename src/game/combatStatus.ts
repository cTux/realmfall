import { StatusEffectTypeId } from './content/ids';
import { getPlayerStats } from './progression';
import { resolveCombatProcCount } from './combatProcs';
import type {
  AbilityRuntimeDefinition,
  Enemy,
  GameState,
  PlayerStatusEffect,
  StatusEffectId,
} from './types';

export type PlayerDebuffApplicationResult = 'applied' | 'suppressed' | 'none';

interface CombatStatusEffectInput {
  id: StatusEffectId;
  value?: number;
  expiresAt?: number;
  tickIntervalMs?: number;
  stacks?: number;
}

export function applyStatusEffectToEnemy(
  state: GameState,
  enemy: Enemy,
  nextEffect: CombatStatusEffectInput,
) {
  const { changed, nextStatusEffects } = upsertStatusEffect(
    state,
    enemy.statusEffects,
    nextEffect,
  );
  enemy.statusEffects = nextStatusEffects;
  return changed;
}

export function applyStatusEffectToPlayer(
  state: GameState,
  nextEffect: CombatStatusEffectInput,
) {
  const { changed, nextStatusEffects } = upsertStatusEffect(
    state,
    state.player.statusEffects,
    nextEffect,
  );
  state.player.statusEffects = nextStatusEffects;
  return changed;
}

export function applyEnemyStatusEffectToPlayer(
  state: GameState,
  nextEffect: CombatStatusEffectInput,
  seedKey: string,
) {
  if (
    resolveCombatProcCount(
      state,
      `${seedKey}:suppress-debuff`,
      getPlayerStats(state.player).suppressDebuffChance ?? 0,
    ) > 0
  ) {
    return 'suppressed' satisfies PlayerDebuffApplicationResult;
  }

  return applyStatusEffectToPlayer(state, nextEffect)
    ? ('applied' satisfies PlayerDebuffApplicationResult)
    : ('none' satisfies PlayerDebuffApplicationResult);
}

export function applyLifesteal(
  state: GameState,
  damage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  const lifestealChance = playerStats.lifestealChance ?? 0;
  if (lifestealChance <= 0) return;

  const procCount = resolveCombatProcCount(
    state,
    'player:lifesteal',
    lifestealChance,
  );
  if (procCount <= 0) return;

  const healPerProc = Math.max(
    1,
    Math.floor(
      getPlayerStats(state.player).maxHp *
        ((playerStats.lifestealAmount ?? 0) / 100),
    ),
  );
  if (damage <= 0 || healPerProc <= 0) return;

  state.player.hp = Math.min(
    getPlayerStats(state.player).maxHp,
    state.player.hp + healPerProc * procCount,
  );
}

export function applyPlayerOnHitEffects(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
  damage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  if (damage <= 0) return;

  applyLifesteal(state, damage, playerStats);
  applyStatusProcToEnemy(
    state,
    enemy,
    'bleeding',
    playerStats.bleedChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToEnemy(
    state,
    enemy,
    'poison',
    playerStats.poisonChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToEnemy(
    state,
    enemy,
    'burning',
    playerStats.burningChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToEnemy(
    state,
    enemy,
    'chilling',
    playerStats.chillingChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToPlayer(
    state,
    'power',
    playerStats.powerBuffChance ?? 0,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToPlayer(
    state,
    'frenzy',
    playerStats.frenzyBuffChance ?? 0,
    playerStats.attackSpeed ?? 1,
  );
}

export function maybeApplyConfiguredStatusToEnemy(
  state: GameState,
  enemy: Enemy,
  effect: Extract<
    AbilityRuntimeDefinition['effects'][number],
    { kind: 'damage' }
  >,
  attackValue: number,
) {
  if (!effect.statusEffectId || !effect.statusChance) return;
  if (
    resolveCombatProcCount(
      state,
      `enemy:${enemy.id}:${effect.statusEffectId}`,
      effect.statusChance,
    ) <= 0
  ) {
    return;
  }

  applyStatusEffectToEnemy(state, enemy, {
    id: effect.statusEffectId,
    value: Math.max(
      1,
      Math.round(
        attackValue * (effect.valueMultiplier ?? 0) + (effect.valueFlat ?? 0),
      ),
    ),
    expiresAt: state.worldTimeMs + (effect.durationMs ?? 6_000),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  });
}

export function maybeApplyConfiguredStatusToPlayer(
  state: GameState,
  effect: Extract<
    AbilityRuntimeDefinition['effects'][number],
    { kind: 'damage' }
  >,
  attackValue: number,
  abilityId: string,
  enemyId: string,
) {
  if (!effect.statusEffectId || !effect.statusChance) {
    return 'none' satisfies PlayerDebuffApplicationResult;
  }
  if (
    resolveCombatProcCount(
      state,
      `player:${effect.statusEffectId}`,
      effect.statusChance,
    ) <= 0
  ) {
    return 'none' satisfies PlayerDebuffApplicationResult;
  }

  return applyEnemyStatusEffectToPlayer(
    state,
    {
      id: effect.statusEffectId,
      value: Math.max(
        1,
        Math.round(
          attackValue * (effect.valueMultiplier ?? 0) + (effect.valueFlat ?? 0),
        ),
      ),
      expiresAt: state.worldTimeMs + (effect.durationMs ?? 6_000),
      tickIntervalMs: effect.tickIntervalMs,
      stacks: effect.stacks ?? 1,
    },
    `${enemyId}:${abilityId}:${effect.statusEffectId}:configured`,
  );
}

export function processEnemyStatusEffects(
  state: GameState,
  onEnemyDefeat: (
    state: GameState,
    enemy: NonNullable<GameState['enemies'][string]>,
  ) => void,
) {
  let changed = false;

  for (const enemyId of state.combat?.enemyIds ?? []) {
    const enemy = state.enemies[enemyId];
    if (!enemy?.statusEffects || enemy.statusEffects.length === 0) continue;

    const nextEffects = [];
    for (const effect of enemy.statusEffects) {
      const lastProcessedAt = effect.lastProcessedAt ?? state.worldTimeMs;
      const effectEndAt = effect.expiresAt ?? lastProcessedAt;
      const effectiveNow = Math.min(state.worldTimeMs, effectEndAt);
      const tickIntervalMs = effect.tickIntervalMs ?? 1_000;
      const tickCount = Math.floor(
        Math.max(0, effectiveNow - lastProcessedAt) / tickIntervalMs,
      );

      if (tickCount > 0) {
        const stacks = Math.max(1, effect.stacks ?? 1);
        const damagePerTick =
          effect.id === StatusEffectTypeId.Poison
            ? Math.max(1, Math.floor(enemy.maxHp * 0.01 * stacks))
            : effect.id === StatusEffectTypeId.Burning
              ? Math.max(1, Math.floor(effect.value ?? 0) * stacks)
              : effect.id === StatusEffectTypeId.Bleeding
                ? Math.max(1, Math.floor(effect.value ?? 0))
                : 0;
        const healPerTick =
          effect.id === StatusEffectTypeId.Restoration
            ? Math.max(1, Math.floor(enemy.maxHp * ((effect.value ?? 1) / 100)))
            : 0;
        if (damagePerTick > 0) {
          enemy.hp = Math.max(0, enemy.hp - damagePerTick * tickCount);
          changed = true;
        }
        if (healPerTick > 0) {
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + healPerTick * tickCount);
          changed = true;
        }
      }

      if (effect.expiresAt != null && state.worldTimeMs >= effect.expiresAt) {
        changed = true;
        continue;
      }

      const nextLastProcessedAt = lastProcessedAt + tickCount * tickIntervalMs;
      nextEffects.push({
        ...effect,
        lastProcessedAt: nextLastProcessedAt,
      });
    }

    enemy.statusEffects = nextEffects;
    if (enemy.hp <= 0) {
      onEnemyDefeat(state, enemy);
      changed = true;
      if (!state.combat) {
        return true;
      }
    }
  }

  return changed;
}

export function getNextCombatStatusEffectEventAt(
  statusEffects: PlayerStatusEffect[] | undefined,
  worldTimeMs: number,
) {
  if (!statusEffects?.length) return undefined;

  return statusEffects.reduce<number | undefined>((soonest, effect) => {
    const nextEventAt = getNextStatusEffectEventAt(effect, worldTimeMs);
    if (nextEventAt == null) {
      return soonest;
    }

    if (soonest == null) {
      return nextEventAt;
    }

    return Math.min(soonest, nextEventAt);
  }, undefined);
}

function applyStatusProcToEnemy(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
  effectId: 'bleeding' | 'poison' | 'burning' | 'chilling',
  chance: number,
  attackValue: number,
  attackSpeed: number,
) {
  const procCount = resolveCombatProcCount(
    state,
    `enemy:${enemy.id}:${effectId}`,
    chance,
  );
  if (procCount <= 0) return;

  applyStatusEffectToEnemy(state, enemy, {
    id:
      effectId === 'poison'
        ? StatusEffectTypeId.Poison
        : effectId === 'burning'
          ? StatusEffectTypeId.Burning
          : effectId === 'bleeding'
            ? StatusEffectTypeId.Bleeding
            : StatusEffectTypeId.Chilling,
    value:
      effectId === 'poison'
        ? 1
        : effectId === 'burning'
          ? Math.max(1, attackValue)
          : effectId === 'bleeding'
            ? Math.max(1, attackValue)
            : 20,
    expiresAt: state.worldTimeMs + 10_000,
    tickIntervalMs:
      effectId === 'chilling'
        ? undefined
        : Math.max(1, Math.round(2_000 / Math.max(0.01, attackSpeed))),
    stacks: effectId === 'poison' || effectId === 'burning' ? procCount : 1,
  });
}

function applyStatusProcToPlayer(
  state: GameState,
  effectId: 'power' | 'frenzy',
  chance: number,
  attackSpeed: number,
) {
  const procCount = resolveCombatProcCount(state, `player:${effectId}`, chance);
  if (procCount <= 0) return;

  applyStatusEffectToPlayer(state, {
    id:
      effectId === 'power'
        ? StatusEffectTypeId.Power
        : StatusEffectTypeId.Frenzy,
    value: effectId === 'power' ? 10 : 20,
    expiresAt: state.worldTimeMs + 10_000,
    tickIntervalMs: Math.max(
      1,
      Math.round(2_000 / Math.max(0.01, attackSpeed)),
    ),
    stacks: 1,
  });
}

function getNextStatusEffectEventAt(
  effect: PlayerStatusEffect,
  worldTimeMs: number,
) {
  const eventTimes: number[] = [];
  const lastProcessedAt = effect.lastProcessedAt ?? worldTimeMs;

  if (isTickingCombatStatusEffect(effect.id)) {
    const tickIntervalMs = effect.tickIntervalMs ?? 1_000;
    const nextTickAt = lastProcessedAt + tickIntervalMs;
    if (effect.expiresAt == null || nextTickAt <= effect.expiresAt) {
      eventTimes.push(nextTickAt);
    }
  }

  if (effect.expiresAt != null) {
    eventTimes.push(effect.expiresAt);
  }

  if (eventTimes.length === 0) {
    return undefined;
  }

  return Math.max(worldTimeMs, Math.min(...eventTimes));
}

function isTickingCombatStatusEffect(statusEffectId: StatusEffectId) {
  return (
    statusEffectId === StatusEffectTypeId.Bleeding ||
    statusEffectId === StatusEffectTypeId.Burning ||
    statusEffectId === StatusEffectTypeId.Poison ||
    statusEffectId === StatusEffectTypeId.Restoration
  );
}

function upsertStatusEffect(
  state: GameState,
  statusEffects: PlayerStatusEffect[] | undefined,
  nextEffect: CombatStatusEffectInput,
) {
  const currentEffect = statusEffects?.find(
    (effect) => effect.id === nextEffect.id,
  );
  const merged = mergeStatusEffect(state, currentEffect, nextEffect);
  return {
    changed:
      !currentEffect ||
      currentEffect.value !== merged.value ||
      currentEffect.expiresAt !== merged.expiresAt ||
      currentEffect.stacks !== merged.stacks,
    nextStatusEffects: [
      ...(statusEffects ?? []).filter((effect) => effect.id !== merged.id),
      merged,
    ],
  };
}

function mergeStatusEffect(
  state: GameState,
  currentEffect: PlayerStatusEffect | undefined,
  nextEffect: CombatStatusEffectInput,
) {
  const stacks =
    nextEffect.id === StatusEffectTypeId.Poison ||
    nextEffect.id === StatusEffectTypeId.Burning
      ? Math.max(1, (currentEffect?.stacks ?? 0) + (nextEffect.stacks ?? 1))
      : (nextEffect.stacks ?? 1);

  return {
    id: nextEffect.id,
    value: nextEffect.value,
    expiresAt: nextEffect.expiresAt,
    tickIntervalMs: nextEffect.tickIntervalMs,
    lastProcessedAt: state.worldTimeMs,
    stacks,
  };
}
