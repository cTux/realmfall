import type { GameState } from '../game/stateTypes';
import {
  isCooldownMap,
  isFiniteNumber,
  isRecord,
  isStringArray,
  normalizeHexCoord,
} from './normalizeShared';

export function normalizeCombatState(value: unknown) {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const coord = normalizeHexCoord(value.coord);
  const player = normalizeCombatActorState(value.player);
  const enemies = normalizeCombatActors(value.enemies);
  const enemyIds = isStringArray(value.enemyIds) ? [...value.enemyIds] : null;

  if (
    !coord ||
    !player ||
    !enemies ||
    !enemyIds ||
    typeof value.started !== 'boolean'
  ) {
    return null;
  }

  return {
    coord,
    enemyIds,
    started: value.started,
    ...(isFiniteNumber(value.startedAtMs)
      ? { startedAtMs: value.startedAtMs }
      : {}),
    player,
    enemies,
    enemyStateById: normalizeCombatEnemyEncounterStates(
      value.enemyStateById,
      enemyIds,
    ),
  };
}

function normalizeCombatActors(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const entries = Object.entries(value).map(([key, actor]) => {
    const normalizedActor = normalizeCombatActorState(actor);
    return normalizedActor ? ([key, normalizedActor] as const) : null;
  });

  if (entries.some((entry) => entry === null)) {
    return null;
  }

  return Object.fromEntries(
    entries as Array<
      readonly [string, NonNullable<GameState['combat']>['player']]
    >,
  );
}

function normalizeCombatActorState(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isStringArray(value.abilityIds) ||
    !isFiniteNumber(value.globalCooldownMs) ||
    !isFiniteNumber(value.globalCooldownEndsAt) ||
    !isCooldownMap(value.cooldownEndsAt)
  ) {
    return null;
  }

  if (
    (value.effectiveGlobalCooldownMs !== undefined &&
      !isFiniteNumber(value.effectiveGlobalCooldownMs)) ||
    (value.effectiveCooldownMs !== undefined &&
      !isCooldownMap(value.effectiveCooldownMs))
  ) {
    return null;
  }

  const casting = normalizeCombatCastState(value.casting);
  if (value.casting !== null && value.casting !== undefined && !casting) {
    return null;
  }

  return {
    abilityIds: [...value.abilityIds],
    globalCooldownMs: value.globalCooldownMs,
    ...(value.effectiveGlobalCooldownMs === undefined
      ? {}
      : { effectiveGlobalCooldownMs: value.effectiveGlobalCooldownMs }),
    globalCooldownEndsAt: value.globalCooldownEndsAt,
    cooldownEndsAt: { ...value.cooldownEndsAt },
    ...(value.effectiveCooldownMs === undefined
      ? {}
      : { effectiveCooldownMs: { ...value.effectiveCooldownMs } }),
    casting: casting ?? null,
  };
}

function normalizeCombatCastState(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    !isRecord(value) ||
    typeof value.abilityId !== 'string' ||
    typeof value.targetId !== 'string' ||
    !isFiniteNumber(value.endsAt)
  ) {
    return null;
  }

  return {
    abilityId: value.abilityId,
    targetId: value.targetId,
    endsAt: value.endsAt,
  };
}

function normalizeCombatEnemyEncounterStates(
  value: unknown,
  enemyIds: string[],
): NonNullable<GameState['combat']>['enemyStateById'] {
  const states = isRecord(value) ? value : {};

  return Object.fromEntries(
    enemyIds.map((enemyId) => [
      enemyId,
      normalizeCombatEnemyEncounterState(states[enemyId]),
    ]),
  );
}

function normalizeCombatEnemyEncounterState(
  value: unknown,
): NonNullable<GameState['combat']>['enemyStateById'][string] {
  if (!isRecord(value)) {
    return {};
  }

  const treasureGoblin = normalizeCombatTreasureGoblinEncounterState(
    value.treasureGoblin,
  );

  return treasureGoblin ? { treasureGoblin } : {};
}

function normalizeCombatTreasureGoblinEncounterState(value: unknown) {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.damageHitsTaken) ||
    !isFiniteNumber(value.fleeHitsRequired)
  ) {
    return null;
  }

  return {
    damageHitsTaken: value.damageHitsTaken,
    fleeHitsRequired: value.fleeHitsRequired,
  };
}
