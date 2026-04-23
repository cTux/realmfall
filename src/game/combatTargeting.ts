import { getAbilityDefinition } from './abilityCatalog';
import { getEnemyMana } from './combatDamage';
import { createRng } from './random';
import type { AbilityId, Enemy, GameState } from './types';

export function canActorCastAbility(
  actor: NonNullable<GameState['combat']>['player'],
  abilityId: AbilityId,
  now: number,
) {
  return (
    actor.globalCooldownEndsAt <= now &&
    (actor.cooldownEndsAt[abilityId] ?? 0) <= now
  );
}

export function getNextActorReadyAt(
  actor: NonNullable<GameState['combat']>['player'],
  worldTimeMs: number,
) {
  if (actor.casting) return undefined;

  return actor.abilityIds.reduce((soonest, abilityId) => {
    const readyAt = Math.max(
      actor.globalCooldownEndsAt,
      actor.cooldownEndsAt[abilityId] ?? worldTimeMs,
    );
    return Math.min(soonest, readyAt);
  }, Number.POSITIVE_INFINITY);
}

export function resolveEnemyTargetsForPlayerAbility(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  targetId: string,
) {
  if (!state.combat) return [] as Enemy[];

  if (ability.target === 'allEnemies') {
    return state.combat.enemyIds
      .map((enemyId) => state.enemies[enemyId])
      .filter((enemy): enemy is Enemy => Boolean(enemy));
  }

  const target = state.enemies[targetId];
  return target ? [target] : [];
}

export function resolveEnemyTargetsForEnemyAbility(
  state: GameState,
  casterId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
) {
  const enemyIds =
    state.combat?.enemyIds.filter((enemyId) =>
      Boolean(state.enemies[enemyId]),
    ) ?? [];

  switch (ability.target) {
    case 'self':
      return state.enemies[casterId] ? [state.enemies[casterId]!] : [];
    case 'injuredAlly':
    case 'randomAlly': {
      const targetId = pickEnemyAllyTarget(
        state,
        casterId,
        ability.id,
        ability.target === 'injuredAlly',
      );
      const target = targetId ? state.enemies[targetId] : null;
      return target ? [target] : [];
    }
    case 'allAllies':
      return enemyIds.map((enemyId) => state.enemies[enemyId]!).filter(Boolean);
    default:
      return [];
  }
}

export function canEnemyUseAbility(
  state: GameState,
  enemyId: string,
  abilityId: AbilityId,
  target: ReturnType<typeof getAbilityDefinition>['target'],
) {
  const enemy = state.enemies[enemyId];
  if (!enemy) return false;
  if (getEnemyMana(enemy) < getAbilityDefinition(abilityId).manaCost) {
    return false;
  }

  if (target === 'injuredAlly') {
    return resolveEnemyTargetsForEnemyAbility(
      state,
      enemyId,
      getAbilityDefinition(abilityId),
    ).some((ally) => ally.hp < ally.maxHp);
  }

  if (
    target === 'self' &&
    getAbilityDefinition(abilityId).effects.some(
      (effect) => effect.kind === 'heal',
    )
  ) {
    return enemy.hp < enemy.maxHp;
  }

  return true;
}

export function selectAbilityTargetId(
  state: GameState,
  actorId: 'player' | string,
  abilityId: AbilityId,
) {
  if (!state.combat) return null;

  const ability = getAbilityDefinition(abilityId);
  if (actorId === 'player') {
    switch (ability.target) {
      case 'enemy':
        return selectEnemyGroupTarget(state);
      case 'randomEnemy':
        return pickRandomEnemyTarget(state, abilityId);
      case 'allEnemies':
        return selectEnemyGroupTarget(state);
      default:
        return 'player';
    }
  }

  switch (ability.target) {
    case 'self':
      return actorId;
    case 'injuredAlly':
    case 'randomAlly':
      return pickEnemyAllyTarget(
        state,
        actorId,
        abilityId,
        ability.target === 'injuredAlly',
      );
    case 'allAllies':
      return actorId;
    case 'enemy':
    case 'randomEnemy':
    case 'allEnemies':
      return selectPlayerGroupTarget(state);
    default:
      return actorId;
  }
}

function selectEnemyGroupTarget(state: GameState) {
  return (
    state.combat?.enemyIds.find((enemyId) => Boolean(state.enemies[enemyId])) ??
    null
  );
}

function selectPlayerGroupTarget(state: GameState) {
  return state.player.hp > 0 ? 'player' : null;
}

function pickRandomEnemyTarget(state: GameState, seedSuffix: string) {
  const enemyIds = state.combat?.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );
  if (!enemyIds || enemyIds.length === 0) return null;
  const rng = createRng(
    `${state.seed}:combat:player-target:${seedSuffix}:${state.worldTimeMs}`,
  );
  return enemyIds[Math.floor(rng() * enemyIds.length)] ?? enemyIds[0] ?? null;
}

function pickEnemyAllyTarget(
  state: GameState,
  casterId: string,
  seedSuffix: string,
  preferInjured: boolean,
) {
  const enemyIds =
    state.combat?.enemyIds.filter((enemyId) =>
      Boolean(state.enemies[enemyId]),
    ) ?? [];
  const allies = enemyIds
    .map((enemyId) => state.enemies[enemyId]!)
    .filter((enemy) => !preferInjured || enemy.hp < enemy.maxHp);
  if (allies.length === 0) {
    return enemyIds.includes(casterId) ? casterId : (enemyIds[0] ?? null);
  }
  const rng = createRng(
    `${state.seed}:combat:enemy-target:${casterId}:${seedSuffix}:${state.worldTimeMs}`,
  );
  return allies[Math.floor(rng() * allies.length)]?.id ?? casterId;
}
